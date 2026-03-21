import { Snowflake } from 'discord.js';

export type VoteType = 'done' | 'failed';

export interface Vote {
  message_id: Snowflake;
  user_id: Snowflake;
  vote_type: VoteType;
}
