import { Snowflake } from 'discord.js';
import { dsClient, DSError } from '../client';
import { Logger } from '@vulps22/logger';
import { ChallengeVote, VoteType } from '@vulps22/project-encourage-types';

export class VotingService {
  /**
   * Initialise vote tracking for a challenge. Returns the created ChallengeVote.
   */
  async addChallenge(challengeId: number): Promise<ChallengeVote> {
    Logger.debug(`Adding challenge ${challengeId} to vote tracking`);
    return await dsClient.initVote(challengeId);
  }

  /**
   * Record a vote atomically — inserts the user vote and increments the
   * relevant count in a single DS operation. Throws DSError(409) if the
   * user has already voted on this challenge.
   */
  async vote(challengeId: number, userId: Snowflake, voteType: VoteType): Promise<ChallengeVote> {
    Logger.debug(`Recording ${voteType} vote from user ${userId} on challenge ${challengeId}`);
    return voteType === 'done'
      ? dsClient.recordVoteDone(challengeId, userId)
      : dsClient.recordVoteFail(challengeId, userId);
  }

  /**
   * Return the current vote counts for a challenge.
   */
  async getVoteCount(challengeId: number): Promise<ChallengeVote> {
    try {
      return (await dsClient.getVotes(challengeId))!;
    } catch (error) {
      if (error instanceof DSError && error.status === 404) throw new Error('NO_TRACKING');
      throw error;
    }
  }

  /**
   * Set the final result on challenge_votes.
   */
  async finalizeChallenge(challengeId: number, result: 'done' | 'failed' | 'skipped'): Promise<ChallengeVote> {
    Logger.debug(`Finalizing challenge ${challengeId} as ${result}`);
    return (await dsClient.finalizeVote(challengeId, result))!;
  }
}
