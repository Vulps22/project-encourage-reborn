import { Entitlement, REST, Routes } from 'discord.js';
import { dsClient } from '../client';
import { Logger } from '@vulps22/logger';

/**
 * EntitlementService - Captures and reconciles Discord entitlement lifecycle events
 *
 * This is a capture-only skeleton: it records every entitlement event Discord sends
 * (and backfills any missed while the bot was offline) into DS's audit log.
 * It does not interpret subscription/consumable semantics or grant perks.
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
