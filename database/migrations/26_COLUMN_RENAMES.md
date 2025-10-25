# Issue #26 - Column Rename Reference

This document lists all column renames from camelCase to snake_case.  
**All code referencing these columns must be updated.**

## questions table
| Old Name (camelCase) | New Name (snake_case) |
|---------------------|----------------------|
| `isApproved` | `is_approved` |
| `approvedBy` | `approved_by` |
| `isBanned` | `is_banned` |
| `banReason` | `ban_reason` |
| `bannedBy` | `banned_by` |
| `serverId` | `server_id` |
| `messageId` | `message_id` |
| `isDeleted` | `is_deleted` |

## users table
| Old Name (camelCase) | New Name (snake_case) |
|---------------------|----------------------|
| `globalLevel` | `global_level` |
| `globalLevelXp` | `global_level_xp` |
| `rulesAccepted` | `rules_accepted` |
| `isBanned` | `is_banned` |
| `banReason` | `ban_reason` |
| `voteCount` | `vote_count` |
| `deleteDate` | `delete_date` |

## servers table
| Old Name (camelCase) | New Name (snake_case) |
|---------------------|----------------------|
| `hasAccepted` | `has_accepted` |
| `isBanned` | `is_banned` |
| `banReason` | `ban_reason` |
| `isDeleted` | `is_deleted` |

## user_questions table
| Old Name (camelCase) | New Name (snake_case) |
|---------------------|----------------------|
| `messageId` | `message_id` |
| `userId` | `user_id` |
| `questionId` | `question_id` |
| `serverId` | `server_id` |
| `channelId` | `channel_id` |
| `imageUrl` | `image_url` |
| `doneCount` | `done_count` |
| `failedCount` | `failed_count` |
| `finalResult` | `final_result` |

## given_questions table
| Old Name (camelCase) | New Name (snake_case) |
|---------------------|----------------------|
| `senderId` | `sender_id` |
| `targetId` | `target_id` |
| `serverId` | `server_id` |
| `messageId` | `message_id` |
| `doneCount` | `done_count` |
| `failCount` | `fail_count` |
| `xpType` | `xp_type` |

## reports table
| Old Name (camelCase) | New Name (snake_case) |
|---------------------|----------------------|
| `moderatorId` | `moderator_id` |
| `banReason` | `ban_reason` |
| `senderId` | `sender_id` |
| `offenderId` | `offender_id` |
| `serverId` | `server_id` |

## Total Changes
- **6 tables** affected
- **43 columns** renamed

## Code Update Checklist
Before deploying this migration, ensure all code references are updated:

- [ ] All SQL queries in services
- [ ] All database models/interfaces
- [ ] All views that reference these columns (✓ already updated in schema)
- [ ] All triggers that reference these columns (✓ already updated in schema)
- [ ] Test files with mock data
- [ ] Type definitions

## Migration Files
- Rollout: `26_rollout.sql` (also drops user_dares and user_truths)
- Rollback: `26_rollback.sql`

## Testing
After code updates:
1. Run all tests: `npm test`
2. Test migration on dev database: `npm run db:rollout 26`
3. Verify all functionality works
4. Test rollback: `npm run db:rollback 26`
5. Rollout again and deploy
