import { Entitlement, REST, Routes } from 'discord.js';
import { dsClient, DSError } from '../client';
import { Purchasable, PurchasableQuery } from '../types';
import { Logger } from '@vulps22/logger';

/**
 * EntitlementService - Captures and reconciles Discord entitlement lifecycle events
 *
 * Records every entitlement event Discord sends (and backfills any missed while the
 * bot was offline) into DS's audit log, then routes live events to the
 * EntitlementHandler registered for the purchasable's name slug.
 */
export class EntitlementService {
  /**
   * Capture a single entitlement lifecycle event and forward it to DS for audit logging.
   *
   * @param entitlement Discord.js parsed Entitlement object from the gateway event
   * @param type Which lifecycle event fired: 'create' | 'update' | 'delete'
   */
  async capture(entitlement: Entitlement, type: 'create' | 'update' | 'delete'): Promise<void> {
    const data = {
      id: entitlement.id,
      skuId: entitlement.skuId,
      userId: entitlement.userId,
      guildId: entitlement.guildId,
      type: entitlement.type,
      deleted: entitlement.deleted,
      startsTimestamp: entitlement.startsTimestamp,
      endsTimestamp: entitlement.endsTimestamp,
      consumed: entitlement.consumed,
    };

    try {
      await dsClient.recordEntitlementEvent(type, entitlement.id, data);
    } catch (error) {
      Logger.error(`Failed to record entitlement ${type} event for entitlement ${entitlement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Capture an entitlement lifecycle event, then dispatch it to the handler for its
   * purchasable. Never throws - a failure here must not take down the gateway listener.
   */
  async handle(entitlement: Entitlement, type: 'create' | 'update' | 'delete'): Promise<void> {
    await this.capture(entitlement, type);

    try {
      const slug = await this.getSlug(entitlement.skuId);
      if (!slug) {
        Logger.error(`No purchasable registered for SKU ${entitlement.skuId} (entitlement ${entitlement.id}) - ${type} not handled`);
        return;
      }

      const handler = global.entitlements.get(slug);
      if (!handler) {
        Logger.error(`No entitlement handler registered for purchasable "${slug}" (entitlement ${entitlement.id}) - ${type} not handled`);
        return;
      }

      await handler[type]?.(entitlement);
    } catch (error) {
      Logger.error(`Failed to handle entitlement ${type} event for entitlement ${entitlement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve a SKU to its purchasable's name slug, or null if the SKU isn't in the catalogue.
   */
  async getSlug(skuId: string): Promise<string | null> {
    const purchasable = await this.getPurchasable({ sku: skuId });
    return purchasable?.name ?? null;
  }

  /**
   * Look up a purchasable in DS's catalogue, or null if none matches.
   */
  async getPurchasable(query: PurchasableQuery): Promise<Purchasable | null> {
    try {
      return await dsClient.getPurchasable(query);
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  /**
   * Sweep Discord's current entitlement list and forward it to DS to backfill any
   * events missed while the bot was offline (Gateway dispatches aren't queued or replayable).
   */
  async reconcile(): Promise<void> {
    try {
      if (!process.env.PE_DISCORD_TOKEN || !process.env.PE_CLIENT_ID) {
        Logger.error('Cannot reconcile entitlements: PE_DISCORD_TOKEN or PE_CLIENT_ID is not set');
        return;
      }

      const rest = new REST({ version: '10' }).setToken(process.env.PE_DISCORD_TOKEN);
      const entitlements = await rest.get(Routes.entitlements(process.env.PE_CLIENT_ID)) as unknown[];

      await dsClient.reconcileEntitlements(entitlements);
    } catch (error) {
      Logger.error(`Failed to reconcile entitlements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
