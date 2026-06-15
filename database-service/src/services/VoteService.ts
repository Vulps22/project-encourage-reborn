import { ChallengeVote, Snowflake, VoteType } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export class VoteService {
  constructor(private db: DatabaseService) {}

  async init(challengeId: number): Promise<ChallengeVote> {
    const result = await this.db.insert('vote', 'challenge_votes', { challenge_id: challengeId });

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to init vote tracking');
    }

    return result.rows[0] as ChallengeVote;
  }

  async getVotes(challengeId: number): Promise<ChallengeVote | null> {
    return this.db.get<ChallengeVote>('vote', 'challenge_votes', { challenge_id: challengeId });
  }

  async finalise(challengeId: number, result: 'done' | 'failed' | 'skipped'): Promise<ChallengeVote | null> {
    const res = await this.db.update('vote', 'challenge_votes', {
      final_result: result,
      finalised_datetime: new Date(),
    }, { challenge_id: challengeId });

    return res.rows && res.rows.length > 0 ? res.rows[0] as ChallengeVote : null;
  }

  async hasUserVoted(challengeId: number, userId: Snowflake): Promise<boolean> {
    const vote = await this.db.get('vote', 'user_votes', { challenge_id: challengeId, user_id: userId });
    return vote !== null;
  }

  async vote(challengeId: number, userId: Snowflake, type: VoteType): Promise<ChallengeVote> {
    return this.db.transaction(async (txDb) => {
      const existing = await txDb.get('vote', 'user_votes', { challenge_id: challengeId, user_id: userId });
      if (existing) {
        throw new Error('ALREADY_VOTED');
      }

      await txDb.insert('vote', 'user_votes', {
        challenge_id: challengeId,
        user_id: userId,
        vote_type: type,
      });

      const field = type === 'done' ? 'done_count' : 'failed_count';
      const result = await txDb.execute(
        `UPDATE "vote"."challenge_votes" SET "${field}" = "${field}" + 1 WHERE challenge_id = $1 RETURNING *`,
        [challengeId]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to increment vote count');
      }

      return result.rows[0] as ChallengeVote;
    });
  }
}
