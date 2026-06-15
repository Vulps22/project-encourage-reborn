import { Snowflake } from "discord.js";
import { Logger } from "../utils";
import { ServerProfile } from "@vulps22/project-encourage-types";
import { questionService, serverService } from "../../services";

export class ServerProfileBuilder {
  async getServerProfile(serverId: Snowflake): Promise<ServerProfile | null> {
    Logger.debug(`Fetching server profile for ${serverId}`);

    const server = await serverService.getServerSettings(serverId);
    if (!server) {
      return null;
    }

    const [userCount, bannedUserCount, questionCount, approvedQuestionCount, bannedQuestionCount] = await Promise.all([
      serverService.getServerUserCount(serverId),
      serverService.getServerBannedUserCount(serverId),
      questionService.getServerQuestionCount(serverId),
      questionService.getServerApprovedQuestionCount(serverId),
      questionService.getServerBannedQuestionCount(serverId),
    ]);

    const profile: ServerProfile = {
      id: server.id,
      name: server.name,
      user_id: server.user_id,
      can_create: server.can_create,
      is_banned: server.is_banned,
      ban_reason: server.ban_reason,
      message_id: server.message_id,
      userCount,
      bannedUserCount,
      questionCount,
      approvedQuestionCount,
      bannedQuestionCount,
    };

    Logger.debug(`Server profile for ${serverId} retrieved successfully`);
    return profile;
  }
}
