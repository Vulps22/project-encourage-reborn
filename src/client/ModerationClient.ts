import { Client, ClientError } from './Client';
import { TargetType } from '../types';

export class MSError extends ClientError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = 'MSError';
  }
}

export class ModerationClient extends Client {
  protected override makeError(status: number, message: string): MSError {
    return new MSError(status, message);
  }

  // ===== QUESTION =====

  /** Notify MS of a newly created question so it can post it to the moderation log. */
  async submitQuestion(questionId: number): Promise<void> {
    console.log(`[DEBUG PE/ModerationClient] submitQuestion — POSTing questionId=${questionId} to MS /question`);
    const result = await this.post<{ success: boolean; questionId: number }>('/question', undefined, { questionId });
    console.log(`[DEBUG PE/ModerationClient] MS responded — success=${result.success} questionId=${result.questionId}`);
  }

  // ===== REPORT =====

  /** Submit a user report to MS for moderation. */
  async submitReport(
    senderId: string,
    offenderId: string,
    type: TargetType,
    serverId: string,
    content?: string | null,
    reason?: string
  ): Promise<number> {
    const res = await this.post<{ success: boolean; reportId: number }>('/report', undefined, {
      senderId,
      offenderId,
      content: content ?? null,
      type,
      serverId,
      reason,
    });
    return res.reportId;
  }

  // ===== PING =====

  async ping(): Promise<boolean> {
    try {
      await this.get<{ message: string }>('/ping');
      return true;
    } catch {
      return false;
    }
  }
}
