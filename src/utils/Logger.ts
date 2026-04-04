import { BaseInteraction } from 'discord.js';

/**
 * Logger - Webhook-based utility for logging bot execution.
 *
 * All interaction logging goes directly to Discord via webhook HTTP calls,
 * bypassing the shard manager entirely for minimum latency.
 */
export class Logger {
  private static sensitiveValues: Set<string> = new Set();
  private static logWebhookId: string | null = null;
  private static logWebhookToken: string | null = null;
  private static errorWebhookUrl: string | null = null;
  private static consoleLines: Map<string, string> = new Map();

  private static readonly SENSITIVE_KEY_PATTERNS = [
    'TOKEN', 'SECRET', 'PASSWORD', 'WEBHOOK', 'DATABASE', 'DB_', 'MONGO',
    'REDIS', 'API_KEY', 'PRIVATE', 'CREDENTIAL', 'AUTH'
  ];

  static initialize(): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (!value || value.length < 8) continue;
      const upperKey = key.toUpperCase();
      if (this.SENSITIVE_KEY_PATTERNS.some(pattern => upperKey.includes(pattern))) {
        this.sensitiveValues.add(value);
      }
    }

    const logWebhookUrl = process.env.DISCORD_LOG_WEBHOOK_URL ?? null;
    if (logWebhookUrl) {
      const match = logWebhookUrl.match(/webhooks\/(\d+)\/([^/?]+)/);
      if (match) {
        this.logWebhookId = match[1];
        this.logWebhookToken = match[2];
      }
    }

    this.errorWebhookUrl = process.env.DISCORD_ERROR_WEBHOOK_URL ?? null;
  }

  static sanitize(message: string): string {
    let sanitized = message;
    for (const sensitive of this.sensitiveValues) {
      const escaped = sensitive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escaped, 'gi'), 'xxxxxxxxxxxx');
    }
    return sanitized;
  }

  /**
   * Log that an interaction was received.
   * POSTs to the log webhook and returns the message ID for subsequent updates.
   */
  static async logInteractionReceived(interaction: BaseInteraction, typeLabel: string = 'Interaction'): Promise<string> {
    if (!this.logWebhookId || !this.logWebhookToken) return '';

    const msg = `${typeLabel} | Server: ${interaction.guild?.name || 'DM'} - ${interaction.guild?.id || 'N/A'} | User: ${interaction.user.username} - ${interaction.user.id} || Processing`;
    const sanitized = this.sanitize(msg);

    console.log(sanitized);

    try {
      const response = await fetch(
        `https://discord.com/api/webhooks/${this.logWebhookId}/${this.logWebhookToken}?wait=true`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: sanitized }),
        }
      );

      if (!response.ok) return '';

      const data = await response.json() as { id: string };
      this.consoleLines.set(data.id, sanitized);
      return data.id;
    } catch (error) {
      console.error('Failed to log interaction:', error);
      return '';
    }
  }

  /**
   * Update the status of an existing interaction log message.
   * PATCHes the webhook message — fire and forget.
   */
  static updateExecution(executionId: string, message: string): void {
    if (!executionId || !this.logWebhookId || !this.logWebhookToken) return;

    const sanitized = this.sanitize(message);

    const existing = this.consoleLines.get(executionId);
    const prefix = existing ? existing.split('||')[0].trim() : '';
    const updated = `${prefix} || ${sanitized}`;

    if (existing) {
      this.consoleLines.set(executionId, updated);
      process.stdout.write(`\r${updated}\n`);
    }

    void fetch(
      `https://discord.com/api/webhooks/${this.logWebhookId}/${this.logWebhookToken}/messages/${executionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updated }),
      }
    ).catch(err => console.error('Failed to update execution log:', err));
  }

  /**
   * General log — posts to the log webhook (fire and forget) and echoes to console.
   */
  static log(message: string): void {
    const sanitized = this.sanitize(message);
    console.log(sanitized);

    if (!this.logWebhookId || !this.logWebhookToken) return;

    void fetch(
      `https://discord.com/api/webhooks/${this.logWebhookId}/${this.logWebhookToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sanitized }),
      }
    ).catch(err => console.error('Failed to post log to webhook:', err));
  }

  /**
   * Error logging — echoes to console.error and posts to the error webhook (fire and forget).
   */
  static error(message: string): void {
    console.error(this.sanitize(message));

    if (!this.errorWebhookUrl) return;

    void fetch(this.errorWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: this.sanitize(message) }),
    }).catch(err => console.error('Failed to post error to webhook:', err));
  }

  /**
   * Debug logging to console only.
   */
  static debug(message: string): void {
    console.log(this.sanitize(message));
  }
}
