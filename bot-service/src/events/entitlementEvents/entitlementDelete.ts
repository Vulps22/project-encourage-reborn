import { Entitlement } from "discord.js";
import { EventHandler } from "../../types";
import { entitlementService } from "../../services";
import { Logger } from "@vulps22/logger";

const entitlementDelete: EventHandler<'entitlementDelete'> = {
  event: 'entitlementDelete',
  once: false,
  execute: async (entitlement: Entitlement): Promise<void> => {
        Logger.log(`Entitlement ${entitlement.skuId} Deleted for ${entitlement.guildId ? entitlement.guildId : entitlement.userId}`)

    try {
      await entitlementService.capture(entitlement, 'delete');
    } catch (error) {
      Logger.error(`Failed to capture entitlementDelete for entitlement ${entitlement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export default entitlementDelete;
