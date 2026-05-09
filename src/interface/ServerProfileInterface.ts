import { Snowflake } from 'discord.js';

/**
 * @deprecated Use Vulps22/project-encourage-types instead
 */
export interface ServerProfile {
    id: Snowflake;
    name: string | null;
    user_id: Snowflake;
    can_create: boolean;
    is_banned: boolean;
    ban_reason: string | null;
    message_id: Snowflake | null;
    userCount: number;
    bannedUserCount: number;
    questionCount: number;
    approvedQuestionCount: number;
    bannedQuestionCount: number;
}
