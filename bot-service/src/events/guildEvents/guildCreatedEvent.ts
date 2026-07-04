import { Guild } from "discord.js";
import { EventHandler } from "../../types";
import { msClient } from "../../client";
import { Logger } from "@vulps22/logger";

const guildCreated: EventHandler<'guildCreate'> = {
  event: 'guildCreate',
  once: false,
  execute: async (guild: Guild): Promise<void> => {
    Logger.debug(`Joined new guild: ${guild.name} (ID: ${guild.id})`);
    try {
      await msClient.notifyServerJoined(guild.id, guild.name, guild.ownerId);
      Logger.debug(`Server ${guild.name} (ID: ${guild.id}) notified to MS successfully`);
    } catch (error) {
      Logger.error(`Failed to notify MS of new guild ${guild.name} (ID: ${guild.id}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default guildCreated;
