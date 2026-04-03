import { Snowflake } from 'discord.js';

/**
 * Server interface representing a Discord server's configuration and settings
 */
export interface Server {
  id: Snowflake;
  name: string | null;
  user_id: Snowflake;
  has_accepted: boolean;
  can_create: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  banned_by: Snowflake | null;
  datetime_banned: Date | null;
  date_created: Date;
  date_updated: Date;
  dare_success_xp: number;
  dare_fail_xp: number;
  truth_success_xp: number;
  truth_fail_xp: number;
  message_xp: number;
  level_up_channel: Snowflake | null;
  announcement_channel: Snowflake | null;
  is_entitled: boolean;
  entitlement_end_date: Date | null;
  message_id: Snowflake | null;
  is_deleted: boolean;
  datetime_deleted: Date | null;
  playtest_notified: boolean;
}
