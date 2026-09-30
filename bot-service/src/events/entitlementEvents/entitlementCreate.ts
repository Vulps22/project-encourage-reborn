import { Entitlement } from "discord.js";
import { EventHandler } from "../../types";
import { entitlementService } from "../../services";
import { Logger } from "@vulps22/logger";

const entitlementCreate: EventHandler<'entitlementCreate'> = {
  event: 'entitlementCreate',
  once: false,
  execute: async (entitlement: Entitlement): Promise<void> => {
    Logger.log(`Entitlement ${entitlement.skuId} Created for ${entitlement.guildId ? entitlement.guildId : entitlement.userId}`)
    try {
      await entitlementService.handle(entitlement, 'create');
    } catch (error) {
      Logger.error(`Failed to handle entitlementCreate for entitlement ${entitlement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export default entitlementCreate;
