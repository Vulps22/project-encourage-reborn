import { Snowflake } from "discord.js";
import { QuestionType } from "../types";

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  user_id: Snowflake;
  is_approved: boolean;
  approved_by: Snowflake | null;
  datetime_approved: Date | null;
  is_banned: boolean;
  ban_reason: string | null;
  banned_by: Snowflake | null;
  datetime_banned: Date | null;
  created: Date;
  server_id: Snowflake;
  message_id: Snowflake | null;
  is_deleted: boolean;
  datetime_deleted: Date | null;
}
