import { Client, ClientError } from './Client';
import { User } from '../interface/UserInterface';
import { Server } from '../interface/ServerInterface';
import { Question } from '../interface/QuestionInterface';
import { Challenge } from '../interface/ChallengeInterface';
import { ChallengeVote } from '../interface/ChallengeVoteInterface';
import { CoreConfig } from '../interface/CoreConfigInterface';
import { Storable } from '../interface/StorableInterface';
import { InventoryItem } from '../interface/InventoryInterface';
import { Report, ReportStatus } from '../interface/ReportInterface';
import { QuestionType } from '../types';

export class DSError extends ClientError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = 'DSError';
  }
}

export class DatabaseClient extends Client {
  protected override makeError(status: number, message: string): DSError {
    return new DSError(status, message);
  }

  // ===== USER =====

  async getUser(id: string): Promise<User | null> {
    return this.get<User>(`/user/${id}`);
  }

  async upsertUser(id: string, username: string): Promise<User> {
    return this.post<User>('/user', undefined, { id, username });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.patch<User>(`/user/${id}`, undefined, data);
  }

  async banUser(id: string, banReason: string, banMessageId?: string): Promise<User | null> {
    const body: Record<string, unknown> = { ban_reason: banReason };
    if (banMessageId) body.ban_message_id = banMessageId;
    return this.patch<User>(`/user/${id}/ban`, undefined, body);
  }

  async unbanUser(id: string): Promise<User | null> {
    return this.patch<User>(`/user/${id}/unban`, undefined, {});
  }

  async getUserServerCount(id: string): Promise<number> {
    const result = await this.get<{ count: number }>(`/user/${id}/server-count`);
    return result?.count ?? 0;
  }

  async getUserOwnedServerCount(id: string): Promise<number> {
    const result = await this.get<{ count: number }>(`/user/${id}/owned-server-count`);
    return result?.count ?? 0;
  }

  async getUserBannedServerCount(id: string): Promise<number> {
    const result = await this.get<{ count: number }>(`/user/${id}/banned-server-count`);
    return result?.count ?? 0;
  }

  async banUserQuestions(id: string, moderatorId: string): Promise<number> {
    const result = await this.post<{ count: number }>(`/user/${id}/ban-questions`, undefined, { moderator_id: moderatorId });
    return result.count;
  }

  async unbanUserQuestions(id: string): Promise<number> {
    const result = await this.post<{ count: number }>(`/user/${id}/unban-questions`);
    return result.count;
  }

  async banUserServers(id: string, reason: string): Promise<number> {
    const result = await this.post<{ count: number }>(`/user/${id}/ban-servers`, undefined, { reason });
    return result.count;
  }

  async unbanUserServers(id: string): Promise<number> {
    const result = await this.post<{ count: number }>(`/user/${id}/unban-servers`);
    return result.count;
  }

  // ===== INVENTORY =====

  async getInventoryItem(userId: string, storableId: string): Promise<InventoryItem | null> {
    return this.get<InventoryItem>(`/user/${userId}/inventory/${storableId}`);
  }

  async addInventoryItem(userId: string, storableId: string, amount: number): Promise<InventoryItem> {
    return this.post<InventoryItem>(`/user/${userId}/inventory/${storableId}`, undefined, { amount });
  }

  async consumeInventoryItem(userId: string, storableId: string, amount: number): Promise<InventoryItem | false> {
    try {
      return await this.post<InventoryItem>(`/user/${userId}/inventory/${storableId}/consume`, undefined, { amount });
    } catch (e) {
      if (e instanceof DSError && e.status === 409) return false;
      throw e;
    }
  }

  // ===== SERVER =====

  async getServer(id: string): Promise<Server | null> {
    return this.get<Server>(`/server/${id}`);
  }

  async upsertServer(id: string, name: string | null, userId: string): Promise<Server> {
    return this.post<Server>('/server', undefined, { id, name, user_id: userId });
  }

  async updateServer(id: string, data: Partial<Server>): Promise<Server | null> {
    return this.patch<Server>(`/server/${id}`, undefined, data);
  }

  async banServer(id: string, moderatorId: string, banReason: string): Promise<Server | null> {
    return this.patch<Server>(`/server/${id}/ban`, undefined, { moderator_id: moderatorId, ban_reason: banReason });
  }

  async unbanServer(id: string): Promise<Server | null> {
    return this.patch<Server>(`/server/${id}/unban`, undefined, {});
  }

  async deleteServer(id: string): Promise<boolean> {
    const result = await this.delete<{ success: boolean }>(`/server/${id}`);
    return result?.success ?? false;
  }

  async getServerUserCount(id: string): Promise<number> {
    const result = await this.get<{ count: number }>(`/server/${id}/user-count`);
    return result?.count ?? 0;
  }

  async getServerBannedUserCount(id: string): Promise<number> {
    const result = await this.get<{ count: number }>(`/server/${id}/banned-user-count`);
    return result?.count ?? 0;
  }

  async addServerUser(serverId: string, userId: string): Promise<void> {
    await this.post(`/server/${serverId}/users`, undefined, { user_id: userId });
  }

  async removeServerUser(serverId: string, userId: string): Promise<boolean> {
    const result = await this.delete<{ success: boolean }>(`/server/${serverId}/users/${userId}`);
    return result?.success ?? false;
  }

  // ===== QUESTION =====

  async getQuestion(id: number): Promise<Question | null> {
    return this.get<Question>(`/question/${id}`);
  }

  async searchQuestions(q: string): Promise<Question[]> {
    return (await this.get<Question[]>('/question/search', undefined, { q })) ?? [];
  }

  async getRandomQuestion(type?: QuestionType): Promise<Question | null> {
    const query: Record<string, string> = {};
    if (type) query.type = type;
    return this.get<Question>('/question/random', undefined, query);
  }

  async createQuestion(type: QuestionType, question: string, userId: string, serverId: string): Promise<Question> {
    return this.post<Question>('/question', undefined, { type, question, user_id: userId, server_id: serverId });
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<Question | null> {
    return this.patch<Question>(`/question/${id}`, undefined, data);
  }

  async approveQuestion(id: number, moderatorId: string): Promise<Question | null> {
    return this.patch<Question>(`/question/${id}/approve`, undefined, { moderator_id: moderatorId });
  }

  async banQuestion(id: number, moderatorId: string, banReason: string): Promise<Question | null> {
    return this.patch<Question>(`/question/${id}/ban`, undefined, { moderator_id: moderatorId, ban_reason: banReason });
  }

  async countQuestionsByUser(userId: string, approved?: boolean, banned?: boolean): Promise<number> {
    const query: Record<string, string> = { userId };
    if (approved !== undefined) query.approved = String(approved);
    if (banned !== undefined) query.banned = String(banned);
    const result = await this.get<{ count: number }>('/question/count', undefined, query);
    return result?.count ?? 0;
  }

  async countQuestionsByServer(serverId: string, approved?: boolean, banned?: boolean): Promise<number> {
    const query: Record<string, string> = { serverId };
    if (approved !== undefined) query.approved = String(approved);
    if (banned !== undefined) query.banned = String(banned);
    const result = await this.get<{ count: number }>('/question/count', undefined, query);
    return result?.count ?? 0;
  }

  // ===== CHALLENGE =====

  async createChallenge(userId: string, questionId: number, serverId: string, channelId: string | null, username: string, type: QuestionType): Promise<Challenge> {
    return this.post<Challenge>('/challenge', undefined, { user_id: userId, question_id: questionId, server_id: serverId, channel_id: channelId, username, type });
  }

  async getChallenge(id: number): Promise<Challenge | null> {
    return this.get<Challenge>(`/challenge/${id}`);
  }

  async getChallengeByMessageId(messageId: string): Promise<Challenge | null> {
    return this.get<Challenge>(`/challenge/message/${messageId}`);
  }

  async setChallengeMessageId(id: number, messageId: string): Promise<void> {
    await this.patch(`/challenge/${id}/message`, undefined, { message_id: messageId });
  }

  async skipChallenge(id: number): Promise<Challenge | null> {
    return this.patch<Challenge>(`/challenge/${id}/skip`, undefined, {});
  }

  // ===== VOTE =====

  async initVote(challengeId: number): Promise<ChallengeVote> {
    return this.post<ChallengeVote>(`/vote/${challengeId}`);
  }

  async getVotes(challengeId: number): Promise<ChallengeVote | null> {
    return this.get<ChallengeVote>(`/vote/${challengeId}`);
  }

  async recordVoteDone(challengeId: number, userId: string): Promise<ChallengeVote> {
    try {
      return await this.post<ChallengeVote>(`/vote/${challengeId}/done`, undefined, { user_id: userId });
    } catch (e) {
      if (e instanceof DSError && e.status === 409) throw new Error('ALREADY_VOTED');
      throw e;
    }
  }

  async recordVoteFail(challengeId: number, userId: string): Promise<ChallengeVote> {
    try {
      return await this.post<ChallengeVote>(`/vote/${challengeId}/fail`, undefined, { user_id: userId });
    } catch (e) {
      if (e instanceof DSError && e.status === 409) throw new Error('ALREADY_VOTED');
      throw e;
    }
  }

  async finalizeVote(challengeId: number, result: 'done' | 'failed' | 'skipped'): Promise<ChallengeVote | null> {
    return this.patch<ChallengeVote>(`/vote/${challengeId}/finalise`, undefined, { result });
  }

  async hasUserVoted(challengeId: number, userId: string): Promise<boolean> {
    const result = await this.get<{ voted: boolean }>(`/vote/${challengeId}/check`, undefined, { userId });
    return result?.voted ?? false;
  }

  // ===== CONFIG =====

  async getConfig(): Promise<CoreConfig | null> {
    return this.get<CoreConfig>('/config');
  }

  // ===== STORABLE =====

  async getStorable(id: string): Promise<Storable | null> {
    return this.get<Storable>(`/storable/${id}`);
  }

  async listStorables(): Promise<Storable[]> {
    return (await this.get<Storable[]>('/storable')) ?? [];
  }

  // ===== REPORT =====

  async getReport(id: number): Promise<Report | null> {
    return this.get<Report>(`/report/${id}`);
  }

  async listReports(offenderId: string, statuses?: ReportStatus[]): Promise<Report[]> {
    const query: Record<string, string> = { offenderId };
    if (statuses?.length) query.status = statuses.join(',');
    return (await this.get<Report[]>('/report', undefined, query)) ?? [];
  }

  async createReport(data: {
    type: string;
    reason: string;
    content?: string | null;
    sender_id: string;
    offender_id: string;
    server_id: string;
    moderator_id?: string | null;
    ban_reason?: string | null;
  }): Promise<Report> {
    return this.post<Report>('/report', undefined, data as Record<string, unknown>);
  }

  async updateReport(id: number, data: Partial<{
    status: ReportStatus;
    moderator_id: string | null;
    message_id: string | null;
    ban_reason: string | null;
  }>): Promise<Report | null> {
    return this.patch<Report>(`/report/${id}`, undefined, data as Record<string, unknown>);
  }

  // ===== TRACK =====

  async trackInteraction(userId: string, serverId: string, serverOwnerId: string): Promise<void> {
    await this.post('/track', undefined, { user_id: userId, server_id: serverId, server_owner_id: serverOwnerId });
  }
}
