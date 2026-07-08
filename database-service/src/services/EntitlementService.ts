import { DatabaseService } from '../db/DatabaseService';

export type AuditEventType = 'create' | 'update' | 'delete';
export type AuditEventSource = 'gateway' | 'reconciliation';

export interface AuditRow {
  id: number;
  entitlement_id: string;
  type: AuditEventType;
  source: AuditEventSource;
  data: unknown;
  created_at: string;
}

export class EntitlementService {
  constructor(private db: DatabaseService) {}

  /**
   * Append a row to the entitlement audit log. This table is append-only - a
   * 'delete' type here means "Discord fired entitlementDelete, log that fact",
   * not "remove this record".
   */
  async record(
    entitlementId: string,
    type: AuditEventType,
    data: unknown,
    source: AuditEventSource = 'gateway'
  ): Promise<AuditRow> {
    const result = await this.db.insert('entitlement', 'audit', {
      entitlement_id: entitlementId,
      type,
      data: JSON.stringify(data),
      source,
    });

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to record entitlement audit event');
    }

    return result.rows[0] as AuditRow;
  }

  /**
   * The most recent audit row for a given entitlement ID, used by reconciliation
   * to diff Discord's current state against what we last recorded.
   */
  async latestByEntitlementId(entitlementId: string): Promise<AuditRow | null> {
    const rows = await this.db.query<AuditRow>(
      `SELECT * FROM "entitlement"."audit" WHERE entitlement_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [entitlementId]
    );
    return rows[0] ?? null;
  }

  /**
   * Entitlement IDs whose latest audit row isn't already a 'delete' - i.e. entitlements
   * we believe are still open. Used by reconciliation to detect "Discord no longer
   * lists this" drift (missed entitlementDelete events / refunds).
   */
  async distinctOpenEntitlementIds(): Promise<string[]> {
    const rows = await this.db.query<{ entitlement_id: string; type: AuditEventType }>(`
      SELECT DISTINCT ON (entitlement_id) entitlement_id, type
      FROM "entitlement"."audit"
      ORDER BY entitlement_id, created_at DESC
    `);
    return rows
      .filter((row) => row.type !== 'delete')
      .map((row) => row.entitlement_id);
  }

  /**
   * Look up a purchasable by its Discord SKU ID, used by reconciliation to detect
   * catalogue drift (a SKU Discord is selling that isn't registered as a purchasable).
   */
  async findPurchasableBySkuId(skuId: string): Promise<unknown | null> {
    return this.db.get('entitlement', 'purchasables', { sku_id: skuId });
  }

  /**
   * Determines whether an entitlement's meaningful state differs between two raw
   * snapshots, regardless of which shape produced them. Gateway-captured snapshots
   * use discord.js's Entitlement field names (camelCase, epoch-ms timestamps);
   * reconciliation snapshots use Discord's raw REST field names (snake_case, ISO
   * timestamp strings). Comparing those two shapes directly would report drift on
   * every reconciliation pass even when nothing actually changed, so both sides are
   * normalized to a common shape first.
   */
  hasDrifted(latest: unknown, incoming: unknown): boolean {
    return JSON.stringify(this.normalize(latest)) !== JSON.stringify(this.normalize(incoming));
  }

  /**
   * Maps either a gateway-captured or a reconciliation-fetched raw entitlement
   * payload to a single canonical shape for comparison. Deliberately excludes
   * REST-only bookkeeping fields (fulfillment_status, source_type, fulfilled_at,
   * promotion_id, application_id, gift_code_flags) - those don't exist on the
   * gateway shape and aren't entitlement state, only identity/lifecycle fields
   * present on both sides are compared.
   */
  private normalize(raw: unknown): {
    id: string;
    skuId: string | null;
    userId: string | null;
    guildId: string | null;
    type: number | null;
    deleted: boolean;
    consumed: boolean;
    startsTimestamp: number | null;
    endsTimestamp: number | null;
  } {
    const r = (raw ?? {}) as Record<string, unknown>;
    const toId = (value: unknown): string | null =>
      value === null || value === undefined ? null : String(value);

    return {
      id: toId(r.id) ?? '',
      skuId: toId(r.skuId ?? r.sku_id),
      userId: toId(r.userId ?? r.user_id),
      guildId: toId(r.guildId ?? r.guild_id),
      type: typeof r.type === 'number' ? r.type : null,
      deleted: Boolean(r.deleted),
      consumed: Boolean(r.consumed),
      startsTimestamp: this.toTimestamp(r.startsTimestamp ?? r.starts_at),
      endsTimestamp: this.toTimestamp(r.endsTimestamp ?? r.ends_at),
    };
  }

  /**
   * Coerces a timestamp that may be either an epoch-ms number (gateway shape) or
   * an ISO 8601 string (Discord REST shape) into a single comparable epoch-ms form.
   */
  private toTimestamp(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }
}
