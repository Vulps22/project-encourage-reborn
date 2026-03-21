import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';
import { UserQuestion, VoteStatus, VoteType } from '../interface';
import { QuestionType } from '../types';

const VOTE_THRESHOLD = 3; // TODO: load from config.required_votes

export class VotingService {
  constructor(private db: DatabaseService) {}

  /**
   * Create a user_questions row when a question embed is posted.
   * Called by truth/dare/random commands immediately after sending the message.
   */
  async createVoteTracking(
    messageId: Snowflake,
    userId: Snowflake,
    questionId: number,
    serverId: Snowflake,
    channelId: Snowflake | null,
    username: string,
    type: QuestionType
  ): Promise<UserQuestion> {
    Logger.debug(`Creating vote tracking for message ${messageId}`);

    const result = await this.db.insert('user', 'user_questions', {
      message_id: messageId,
      user_id: userId,
      question_id: questionId,
      server_id: serverId,
      channel_id: channelId ?? null,
      username,
      type,
    });

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Failed to create vote tracking for message ${messageId}`);
    }

    Logger.debug(`Vote tracking created for message ${messageId}`);
    return result.rows[0] as UserQuestion;
  }

  /**
   * Check whether a specific user has already voted on a message.
   */
  async hasUserVoted(messageId: Snowflake, userId: Snowflake): Promise<boolean> {
    const vote = await this.db.get(
      'user', 'user_vote',
      { message_id: messageId, user_id: userId }
    );
    return vote !== null;
  }

  /**
   * Record a done/failed vote from a user.
   * Inserts into user_vote and increments the corresponding counter on user_questions.
   *
   * @throws Error with message 'ALREADY_VOTED' if user has already voted
   * @throws Error with message 'NO_TRACKING' if no user_questions row exists
   * @throws Error with message 'QUESTION_FINALIZED' if question already has a final result
   */
  async recordVote(
    messageId: Snowflake,
    userId: Snowflake,
    voteType: VoteType
  ): Promise<UserQuestion> {
    Logger.debug(`Recording ${voteType} vote from user ${userId} on message ${messageId}`);

    const alreadyVoted = await this.hasUserVoted(messageId, userId);
    if (alreadyVoted) {
      throw new Error('ALREADY_VOTED');
    }

    const userQuestion = await this.db.get<UserQuestion>(
      'user', 'user_questions', { message_id: messageId }
    );
    if (!userQuestion) {
      throw new Error('NO_TRACKING');
    }
    if (userQuestion.final_result !== null) {
      throw new Error('QUESTION_FINALIZED');
    }

    await this.db.insert('user', 'user_vote', {
      message_id: messageId,
      user_id: userId,
      vote_type: voteType,
    });

    const countField = voteType === 'done' ? 'done_count' : 'failed_count';
    const newCount = Number(userQuestion[countField as keyof UserQuestion]) + 1;
    await this.db.update(
      'user', 'user_questions',
      { [countField]: newCount },
      { message_id: messageId }
    );

    const updated = await this.db.get<UserQuestion>(
      'user', 'user_questions', { message_id: messageId }
    );

    Logger.debug(`Vote recorded. Updated counts for message ${messageId}`);
    return updated!;
  }

  /**
   * Returns current vote counts and finalization status for a message.
   *
   * @throws Error with message 'NO_TRACKING' if no user_questions row exists
   */
  async getVoteStatus(messageId: Snowflake): Promise<VoteStatus> {
    const userQuestion = await this.db.get<UserQuestion>(
      'user', 'user_questions', { message_id: messageId }
    );
    if (!userQuestion) {
      throw new Error('NO_TRACKING');
    }

    return {
      doneCount: userQuestion.done_count,
      failedCount: userQuestion.failed_count,
      threshold: VOTE_THRESHOLD,
      isFinalized: userQuestion.final_result !== null,
      finalResult: userQuestion.final_result,
    };
  }
}
