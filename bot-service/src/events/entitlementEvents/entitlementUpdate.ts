import { Entitlement } from "discord.js";
import { EventHandler } from "../../types";
import { entitlementService } from "../../services";
import { Logger } from "@vulps22/logger";

const entitlementUpdate: EventHandler<'entitlementUpdate'> = {
  event: 'entitlementUpdate',
  once: false,
  execute: async (_oldEntitlement: Entitlement | null, newEntitlement: Entitlement): Promise<void> => {
      Logger.log(`Entitlement ${newEntitlement.skuId} Updated for ${newEntitlement.guildId ? newEntitlement.guildId : newEntitlement.userId}`)

    try {
      await entitlementService.capture(newEntitlement, 'update');
    } catch (error) {
      Logger.error(`Failed to capture entitlementUpdate for entitlement ${newEntitlement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export default entitlementUpdate;
