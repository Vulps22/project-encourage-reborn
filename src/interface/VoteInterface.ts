import { Snowflake } from 'discord.js';
/**
 * @deprecated Use Vulps22/project-encourage-types instead
 */
export type VoteType = 'done' | 'failed';

/**
 * @deprecated Use Vulps22/project-encourage-types instead
 */
export interface Vote {
  message_id: Snowflake;
  user_id: Snowflake;
  vote_type: VoteType;
}
