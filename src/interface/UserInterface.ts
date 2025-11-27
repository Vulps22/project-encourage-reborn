import { Snowflake } from "discord.js";

export interface User {
  id: Snowflake;
  username: string | null;
  global_level: number;
  global_level_xp: number;
  banned_questions: number;
  rules_accepted: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  vote_count: number;
  ban_message_id: Snowflake | null;
  delete_date: Date | null;
  created_datetime: Date;
}
