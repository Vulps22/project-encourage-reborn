import { Guild } from "discord.js";
import { EventHandler } from "../types";
import { serverService } from "../services";
import { Logger, ModerationLogger } from "../utils";
import { ServerProfileBuilder } from "../builders/ServerProfileBuilder";

const guildCreated: EventHandler<'guildCreate'> = {
  event: 'guildCreate',
  once: false,
  execute: async (guild: Guild): Promise<void> => {
    Logger.debug(`Joined new guild: ${guild.name} (ID: ${guild.id})`);
    try {
      await serverService.getOrCreateServer(guild.id, guild.name, guild.ownerId);
      const profile = await new ServerProfileBuilder().getServerProfile(guild.id);
      if (profile) {
        const message = await ModerationLogger.logServer(profile);
        if (message) await serverService.updateServerSettings(guild.id, { message_id: message.id });
      }
      Logger.debug(`Server ${guild.name} (ID: ${guild.id}) added to database successfully`);
    } catch (error) {
      Logger.error(`Failed to add server ${guild.name} (ID: ${guild.id}) to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default guildCreated;