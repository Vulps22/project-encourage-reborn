import { Snowflake } from 'discord.js';
import { QuestionType } from '../types';

export interface Challenge {
  id: number;
  message_id?: Snowflake;
  user_id: Snowflake;
  question_id: number;
  server_id: Snowflake;
  channel_id: Snowflake | null;
  username: string;
  image_url: string | null;
  skipped: boolean;
  type: QuestionType;
  datetime_created: Date;
}
