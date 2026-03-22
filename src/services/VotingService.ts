import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';
import { ChallengeVote, Vote, VoteType } from '../interface';

export class VotingService {
  constructor(private db: DatabaseService) {}

  /**
   * Initialise vote tracking for a challenge. Returns the created ChallengeVote.
   */
  async addChallenge(challengeId: number): Promise<ChallengeVote> {
    Logger.debug(`Adding challenge ${challengeId} to vote tracking`);

    const result = await this.db.insert('vote', 'challenge_votes', {
      challenge_id: challengeId,
    });

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Failed to initialise vote tracking for challenge ${challengeId}`);
    }

    return result.rows[0] as ChallengeVote;
  }

  /**
   * Check whether a specific user has already voted on a challenge.
   */
  async hasUserVoted(challengeId: number, userId: Snowflake): Promise<boolean> {
    const vote = await this.db.get<Vote>(
      'vote', 'user_votes',
      { challenge_id: challengeId, user_id: userId }
    );
    return vote !== null;
  }

  /**
   * Insert a vote record for a user.
   */
  async recordVote(challengeId: number, userId: Snowflake, voteType: VoteType): Promise<void> {
    Logger.debug(`Recording ${voteType} vote from user ${userId} on challenge ${challengeId}`);

    await this.db.insert('vote', 'user_votes', {
      challenge_id: challengeId,
      user_id: userId,
      vote_type: voteType,
    });
  }

  /**
   * Increment the done_count or failed_count on challenge_votes.
   */
  async incrementCount(challengeId: number, voteType: VoteType): Promise<ChallengeVote> {
    const current = await this.db.get<ChallengeVote>(
      'vote', 'challenge_votes', { challenge_id: challengeId }
    );

    if (!current) {
      throw new Error('NO_TRACKING');
    }

    const field = voteType === 'done' ? 'done_count' : 'failed_count';
    const newCount = current[field] + 1;

    const result = await this.db.update(
      'vote', 'challenge_votes',
      { [field]: newCount },
      { challenge_id: challengeId }
    );

    return result.rows![0] as ChallengeVote;
  }

  /**
   * Return the current vote counts for a challenge.
   */
  async getVoteCount(challengeId: number): Promise<ChallengeVote> {
    const record = await this.db.get<ChallengeVote>(
      'vote', 'challenge_votes', { challenge_id: challengeId }
    );

    if (!record) {
      throw new Error('NO_TRACKING');
    }

    return record;
  }

  /**
   * Set the final result on challenge_votes.
   */
  async finalizeChallenge(challengeId: number, result: 'done' | 'failed' | 'skipped'): Promise<ChallengeVote> {
    Logger.debug(`Finalizing challenge ${challengeId} as ${result}`);

    const res = await this.db.update(
      'vote', 'challenge_votes',
      { final_result: result, finalised_datetime: new Date() },
      { challenge_id: challengeId }
    );

    return res.rows![0] as ChallengeVote;
  }
}
