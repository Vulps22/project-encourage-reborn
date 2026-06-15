import { User, Server, Question, Challenge, ChallengeVote, CoreConfig, Storable, InventoryItem, Report, ReportStatus, QuestionType } from '@vulps22/project-encourage-types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export class DatabaseClient {
  constructor(private baseUrl: string, private token: string) {}

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string>
  ): Promise<{ status: number; data: T; url: string }> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, value);
      }
    }
    const urlStr = url.toString();
    const response = await fetch(urlStr, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => null);
    return { status: response.status, data: data as T, url: urlStr };
  }

  private async _get<T>(path: string, query?: Record<string, string>): Promise<T | null> {
    const { status, data, url } = await this.request<T>('GET', path, undefined, query);
    if (status === 404) return null;
    if (status >= 400) throw new Error(`DS GET ${url} failed: ${status} - ${JSON.stringify(data)}`);
    return data;
  }

  private async _post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const { status, data, url } = await this.request<T>('POST', path, body);
    if (status >= 400) throw new Error(`DS POST ${url} failed: ${status} - ${JSON.stringify(data)}`);
    return data;
  }

  private async _patch<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
    const { status, data, url } = await this.request<T>('PATCH', path, body);
    if (status === 404) return null;
    if (status >= 400) throw new Error(`DS PATCH ${url} failed: ${status} - ${JSON.stringify(data)}`);
    return data;
  }

  private async _delete<T>(path: string): Promise<T | null> {
    const { status, data, url } = await this.request<T>('DELETE', path);
    if (status === 404) return null;
    if (status >= 400) throw new Error(`DS DELETE ${url} failed: ${status} - ${JSON.stringify(data)}`);
    return data;
  }

  // ===== USER =====

  async getUser(id: string): Promise<User | null> {
    return this._get<User>(`/api/v1/user/${id}`);
  }

  async upsertUser(id: string, username: string): Promise<User> {
    return this._post<User>('/api/v1/user', { id, username });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this._patch<User>(`/api/v1/user/${id}`, data as Record<string, unknown>);
  }

  async banUser(id: string, banReason: string, banMessageId?: string): Promise<User | null> {
    const body: Record<string, unknown> = { ban_reason: banReason };
    if (banMessageId) body.ban_message_id = banMessageId;
    return this._patch<User>(`/api/v1/user/${id}/ban`, body);
  }

  async unbanUser(id: string): Promise<User | null> {
    return this._patch<User>(`/api/v1/user/${id}/unban`, {});
  }

  async getUserServerCount(id: string): Promise<number> {
    const result = await this._get<{ count: number }>(`/api/v1/user/${id}/server-count`);
    return result?.count ?? 0;
  }

  async getUserOwnedServerCount(id: string): Promise<number> {
    const result = await this._get<{ count: number }>(`/api/v1/user/${id}/owned-server-count`);
    return result?.count ?? 0;
  }

  async getUserBannedServerCount(id: string): Promise<number> {
    const result = await this._get<{ count: number }>(`/api/v1/user/${id}/banned-server-count`);
    return result?.count ?? 0;
  }

  async banUserQuestions(id: string, moderatorId: string): Promise<number> {
    const result = await this._post<{ count: number }>(`/api/v1/user/${id}/ban-questions`, { moderator_id: moderatorId });
    return result.count;
  }

  async unbanUserQuestions(id: string): Promise<number> {
    const result = await this._post<{ count: number }>(`/api/v1/user/${id}/unban-questions`);
    return result.count;
  }

  async banUserServers(id: string, reason: string): Promise<number> {
    const result = await this._post<{ count: number }>(`/api/v1/user/${id}/ban-servers`, { reason });
    return result.count;
  }

  async unbanUserServers(id: string): Promise<number> {
    const result = await this._post<{ count: number }>(`/api/v1/user/${id}/unban-servers`);
    return result.count;
  }

  // ===== INVENTORY =====

  async getInventoryItem(userId: string, storableId: string): Promise<InventoryItem | null> {
    return this._get<InventoryItem>(`/api/v1/user/${userId}/inventory/${storableId}`);
  }

  async addInventoryItem(userId: string, storableId: string, amount: number): Promise<InventoryItem> {
    return this._post<InventoryItem>(`/api/v1/user/${userId}/inventory/${storableId}`, { amount });
  }

  async consumeInventoryItem(userId: string, storableId: string, amount: number): Promise<InventoryItem | false> {
    const { status, data } = await this.request<InventoryItem>('POST', `/api/v1/user/${userId}/inventory/${storableId}/consume`, { amount });
    if (status === 409) return false;
    if (status >= 400) throw new Error(`DS POST /api/v1/user/${userId}/inventory/${storableId}/consume failed: ${status}`);
    return data;
  }

  // ===== SERVER =====

  async getServer(id: string): Promise<Server | null> {
    return this._get<Server>(`/api/v1/server/${id}`);
  }

  async upsertServer(id: string, name: string | null, userId: string): Promise<Server> {
    return this._post<Server>('/api/v1/server', { id, name, user_id: userId });
  }

  async updateServer(id: string, data: Partial<Server>): Promise<Server | null> {
    return this._patch<Server>(`/api/v1/server/${id}`, data as Record<string, unknown>);
  }

  async banServer(id: string, moderatorId: string, banReason: string): Promise<Server | null> {
    return this._patch<Server>(`/api/v1/server/${id}/ban`, { moderator_id: moderatorId, ban_reason: banReason });
  }

  async unbanServer(id: string): Promise<Server | null> {
    return this._patch<Server>(`/api/v1/server/${id}/unban`, {});
  }

  async deleteServer(id: string): Promise<boolean> {
    const result = await this._delete<{ success: boolean }>(`/api/v1/server/${id}`);
    return result?.success ?? false;
  }

  async getServerUserCount(id: string): Promise<number> {
    const result = await this._get<{ count: number }>(`/api/v1/server/${id}/user-count`);
    return result?.count ?? 0;
  }

  async getServerBannedUserCount(id: string): Promise<number> {
    const result = await this._get<{ count: number }>(`/api/v1/server/${id}/banned-user-count`);
    return result?.count ?? 0;
  }

  async addServerUser(serverId: string, userId: string): Promise<void> {
    await this._post(`/api/v1/server/${serverId}/users`, { user_id: userId });
  }

  async removeServerUser(serverId: string, userId: string): Promise<boolean> {
    const result = await this._delete<{ success: boolean }>(`/api/v1/server/${serverId}/users/${userId}`);
    return result?.success ?? false;
  }

  // ===== QUESTION =====

  async getQuestion(id: number): Promise<Question | null> {
    return this._get<Question>(`/api/v1/question/${id}`);
  }

  async getRandomQuestion(type?: QuestionType): Promise<Question | null> {
    const query: Record<string, string> = {};
    if (type) query.type = type;
    return this._get<Question>('/api/v1/question/random', query);
  }

  async createQuestion(type: QuestionType, question: string, userId: string, serverId: string): Promise<Question> {
    return this._post<Question>('/api/v1/question', { type, question, user_id: userId, server_id: serverId });
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<Question | null> {
    return this._patch<Question>(`/api/v1/question/${id}`, data as Record<string, unknown>);
  }

  async approveQuestion(id: number, moderatorId: string): Promise<Question | null> {
    return this._patch<Question>(`/api/v1/question/${id}/approve`, { moderator_id: moderatorId });
  }

  async banQuestion(id: number, moderatorId: string, banReason: string): Promise<Question | null> {
    return this._patch<Question>(`/api/v1/question/${id}/ban`, { moderator_id: moderatorId, ban_reason: banReason });
  }

  async countQuestionsByUser(userId: string, approved?: boolean, banned?: boolean): Promise<number> {
    const query: Record<string, string> = { userId };
    if (approved !== undefined) query.approved = String(approved);
    if (banned !== undefined) query.banned = String(banned);
    const result = await this._get<{ count: number }>('/api/v1/question/count', query);
    return result?.count ?? 0;
  }

  async countQuestionsByServer(serverId: string, approved?: boolean, banned?: boolean): Promise<number> {
    const query: Record<string, string> = { serverId };
    if (approved !== undefined) query.approved = String(approved);
    if (banned !== undefined) query.banned = String(banned);
    const result = await this._get<{ count: number }>('/api/v1/question/count', query);
    return result?.count ?? 0;
  }

  // ===== CHALLENGE =====

  async createChallenge(userId: string, questionId: number, serverId: string, channelId: string | null, username: string, type: QuestionType): Promise<Challenge> {
    return this._post<Challenge>('/api/v1/challenge', { user_id: userId, question_id: questionId, server_id: serverId, channel_id: channelId, username, type });
  }

  async getChallenge(id: number): Promise<Challenge | null> {
    return this._get<Challenge>(`/api/v1/challenge/${id}`);
  }

  async getChallengeByMessageId(messageId: string): Promise<Challenge | null> {
    return this._get<Challenge>(`/api/v1/challenge/message/${messageId}`);
  }

  async setChallengeMessageId(id: number, messageId: string): Promise<void> {
    await this._patch(`/api/v1/challenge/${id}/message`, { message_id: messageId });
  }

  async skipChallenge(id: number): Promise<Challenge | null> {
    return this._patch<Challenge>(`/api/v1/challenge/${id}/skip`, {});
  }

  // ===== VOTE =====

  async initVote(challengeId: number): Promise<ChallengeVote> {
    return this._post<ChallengeVote>(`/api/v1/vote/${challengeId}`);
  }

  async getVotes(challengeId: number): Promise<ChallengeVote | null> {
    return this._get<ChallengeVote>(`/api/v1/vote/${challengeId}`);
  }

  async recordVoteDone(challengeId: number, userId: string): Promise<ChallengeVote> {
    const { status, data } = await this.request<ChallengeVote>('POST', `/api/v1/vote/${challengeId}/done`, { user_id: userId });
    if (status === 409) throw new Error('ALREADY_VOTED');
    if (status >= 400) throw new Error(`DS POST /api/v1/vote/${challengeId}/done failed: ${status}`);
    return data;
  }

  async recordVoteFail(challengeId: number, userId: string): Promise<ChallengeVote> {
    const { status, data } = await this.request<ChallengeVote>('POST', `/api/v1/vote/${challengeId}/fail`, { user_id: userId });
    if (status === 409) throw new Error('ALREADY_VOTED');
    if (status >= 400) throw new Error(`DS POST /api/v1/vote/${challengeId}/fail failed: ${status}`);
    return data;
  }

  async finalizeVote(challengeId: number, result: 'done' | 'failed' | 'skipped'): Promise<ChallengeVote | null> {
    return this._patch<ChallengeVote>(`/api/v1/vote/${challengeId}/finalise`, { result });
  }

  async hasUserVoted(challengeId: number, userId: string): Promise<boolean> {
    const result = await this._get<{ voted: boolean }>(`/api/v1/vote/${challengeId}/check`, { userId });
    return result?.voted ?? false;
  }

  // ===== CONFIG =====

  async getConfig(): Promise<CoreConfig | null> {
    return this._get<CoreConfig>('/api/v1/config');
  }

  // ===== STORABLE =====

  async getStorable(id: string): Promise<Storable | null> {
    return this._get<Storable>(`/api/v1/storable/${id}`);
  }

  async listStorables(): Promise<Storable[]> {
    return (await this._get<Storable[]>('/api/v1/storable')) ?? [];
  }

  // ===== REPORT =====

  async getReport(id: number): Promise<Report | null> {
    return this._get<Report>(`/api/v1/report/${id}`);
  }

  async listReports(offenderId: string, statuses?: ReportStatus[]): Promise<Report[]> {
    const query: Record<string, string> = { offenderId };
    if (statuses?.length) query.status = statuses.join(',');
    return (await this._get<Report[]>('/api/v1/report', query)) ?? [];
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
    return this._post<Report>('/api/v1/report', data as Record<string, unknown>);
  }

  async updateReport(id: number, data: Partial<{
    status: ReportStatus;
    moderator_id: string | null;
    message_id: string | null;
    ban_reason: string | null;
  }>): Promise<Report | null> {
    return this._patch<Report>(`/api/v1/report/${id}`, data as Record<string, unknown>);
  }

  // ===== TRACK =====

  async trackInteraction(userId: string, serverId: string, serverOwnerId: string): Promise<void> {
    await this._post('/api/v1/track', { user_id: userId, server_id: serverId, server_owner_id: serverOwnerId });
  }
}
