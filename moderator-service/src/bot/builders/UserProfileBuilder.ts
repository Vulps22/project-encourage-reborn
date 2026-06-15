import { Snowflake } from "discord.js";
import { Logger } from "../utils";
import { UserProfile } from "@vulps22/project-encourage-types";
import { questionService, serverService, userService } from "../../services";

export class UserProfileBuilder {
  /**
   * Get user profile with calculated statistics
   * @param userId Discord user ID
   * @returns UserProfile object or null if not found
   */
  async getUserProfile(userId: Snowflake): Promise<UserProfile | null> {
    Logger.debug(`Fetching user profile for ${userId}`);
    
    const user = await userService.getUser(userId);
    if (!user) {
      return null;
    }

    // Get total questions submitted
    const totalQuestionsResult = await questionService.getUserQuestionCount(userId);
    
    // Get approved questions
    const approvedQuestionsResult = await questionService.getUserApprovedQuestionCount(userId);

    // Get banned questions
    const bannedQuestionsResult = await questionService.getUserBannedQuestionCount(userId);

    // Get total servers user is in (from server_users table)
    const totalServersResult = await userService.getUserServerCount(userId);

    // Get servers owned
    const serversOwnedResult = await serverService.getUserOwnedServerCount(userId);

    // Get servers banned from
    const serversBannedResult = await userService.getUserBannedServerCount(userId);

    const profile: UserProfile = {
      id: user.id,
      rulesAccepted: user.rules_accepted,
      isBanned: user.is_banned,
      banReason: user.ban_reason,
      globalLevel: user.global_level,
      globalXP: user.global_level_xp,
      totalQuestions: totalQuestionsResult,
      approvedQuestions: approvedQuestionsResult,
      bannedQuestions: bannedQuestionsResult,
      totalServers: totalServersResult,
      serversOwned: serversOwnedResult,
      serversBanned: serversBannedResult,
      createdDateTime: user.created_datetime,
      deleteDate: user.delete_date
    };

    Logger.debug(`User profile for ${userId} retrieved successfully`);
    return profile;
  }
}