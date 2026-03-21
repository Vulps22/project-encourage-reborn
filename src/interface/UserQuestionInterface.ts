import { Snowflake } from 'discord.js';
import { QuestionType } from '../types';

export interface UserQuestion {
  message_id: Snowflake;
  user_id: Snowflake;
  question_id: number;
  server_id: Snowflake;
  channel_id: Snowflake | null;
  username: string;
  image_url: string | null;
  done_count: number;
  failed_count: number;
  skipped: boolean;
  type: QuestionType;
  final_result: 'done' | 'failed' | 'skipped' | null;
  finalised_datetime: Date | null;
  datetime_created: Date;
}
