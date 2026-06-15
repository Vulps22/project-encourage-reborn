import { Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Logger } from '../bot/utils';
import { ChallengeVote, VoteType } from '@vulps22/project-encourage-types';

export class VotingService {
  constructor(private db: DatabaseClient) {}

  async addChallenge(challengeId: number): Promise<ChallengeVote> {
    Logger.debug(`Adding challenge ${challengeId} to vote tracking`);
    return this.db.initVote(challengeId);
  }

  async hasUserVoted(challengeId: number, userId: Snowflake): Promise<boolean> {
    return this.db.hasUserVoted(challengeId, userId);
  }

  async recordVote(challengeId: number, userId: Snowflake, voteType: VoteType): Promise<void> {
    Logger.debug(`Recording ${voteType} vote from user ${userId} on challenge ${challengeId}`);
    if (voteType === 'done') {
      await this.db.recordVoteDone(challengeId, userId);
    } else {
      await this.db.recordVoteFail(challengeId, userId);
    }
  }

  /**
   * DS increments the vote count atomically inside recordVote (transaction).
   * This method fetches the updated state from DS after the vote has been recorded.
   */
  async incrementCount(challengeId: number, _voteType: VoteType): Promise<ChallengeVote> {
    const record = await this.db.getVotes(challengeId);
    if (!record) throw new Error('NO_TRACKING');
    return record;
  }

  async getVoteCount(challengeId: number): Promise<ChallengeVote> {
    const record = await this.db.getVotes(challengeId);
    if (!record) throw new Error('NO_TRACKING');
    return record;
  }

  async finalizeChallenge(challengeId: number, result: 'done' | 'failed' | 'skipped'): Promise<ChallengeVote> {
    Logger.debug(`Finalizing challenge ${challengeId} as ${result}`);
    const res = await this.db.finalizeVote(challengeId, result);
    if (!res) throw new Error(`Failed to finalize challenge ${challengeId}`);
    return res;
  }
}
