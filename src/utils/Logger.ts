import { BaseInteraction } from 'discord.js';

/**
 * Logger - Webhook-based utility for logging bot execution.
 * * VERBOSE DEBUG MODE ACTIVE *
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
    console.log('\n[Logger Trace] 1. initialize() called.');
    console.log(`[Logger Trace] 2. Total process.env keys found: ${Object.keys(process.env).length}`);
    
    // Check for standard OS env vars vs our injected .env vars
    const hasLogUrl = !!process.env.DISCORD_LOG_WEBHOOK_URL;
    const hasErrorUrl = !!process.env.DISCORD_ERROR_WEBHOOK_URL;
    console.log(`[Logger Trace] 3. DISCORD_LOG_WEBHOOK_URL present in env? ${hasLogUrl}`);
    console.log(`[Logger Trace] 4. DISCORD_ERROR_WEBHOOK_URL present in env? ${hasErrorUrl}`);

    for (const [key, value] of Object.entries(process.env)) {
      if (!value || value.length < 8) continue;
      const upperKey = key.toUpperCase();
      if (this.SENSITIVE_KEY_PATTERNS.some(pattern => upperKey.includes(pattern))) {
        this.sensitiveValues.add(value);
      }
    }

    const logWebhookUrl = process.env.DISCORD_LOG_WEBHOOK_URL ?? null;
    if (logWebhookUrl) {
      console.log('[Logger Trace] 5. Parsing DISCORD_LOG_WEBHOOK_URL...');
      const match = logWebhookUrl.match(/webhooks\/(\d+)\/([^/?]+)/);
      if (match) {
        this.logWebhookId = match[1];
        this.logWebhookToken = match[2];
        console.log(`[Logger Trace] 6. Successfully parsed Webhook ID: ${this.logWebhookId}`);
        console.log(`[Logger Trace] 7. Successfully parsed Webhook Token: [HIDDEN]`);
      } else {
        console.error('[Logger Trace ERROR] 8. Regex failed to parse DISCORD_LOG_WEBHOOK_URL. Format is invalid.');
      }
    }

    this.errorWebhookUrl = process.env.DISCORD_ERROR_WEBHOOK_URL ?? null;
    console.log('[Logger Trace] 9. Initialization complete.\n');
  }

  static sanitize(message: string): string {
    let sanitized = message;
    for (const sensitive of this.sensitiveValues) {
      const escaped = sensitive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escaped, 'gi'), 'xxxxxxxxxxxx');
    }
    return sanitized;
  }

  private static async safeWebhookFetch(url: string, method: string, body: any, context: string): Promise<void> {
    console.log(`\n[Logger Trace] Executing safeWebhookFetch for: ${context}`);
    console.log(`[Logger Trace] Method: ${method}`);
    
    try {
      console.log(`[Logger Trace] Awaiting fetch response...`);
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log(`[Logger Trace] Fetch complete. Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        console.error(`[Logger Trace ERROR] Discord rejected the payload! Reason: ${errorText}`);
      } else {
        console.log(`[Logger Trace] Payload successfully accepted by Discord.`);
      }
    } catch (error) {
      console.error(`[Logger Trace CRITICAL ERROR] Network request completely failed:`, error);
    }
  }

  static async logInteractionReceived(interaction: BaseInteraction, typeLabel: string = 'Interaction'): Promise<string> {
    console.log(`[Logger Trace] logInteractionReceived() triggered by ${interaction.user.username}`);
    
    const msg = `${typeLabel} | Server: ${interaction.guild?.name || 'DM'} - ${interaction.guild?.id || 'N/A'} | User: ${interaction.user.username} - ${interaction.user.id} || Processing`;
    const sanitized = this.sanitize(msg);

    console.log(sanitized);

    if (!this.logWebhookId || !this.logWebhookToken) {
      console.error('[Logger Trace ABORT] Cannot send interaction log: logWebhookId or logWebhookToken is null.');
      return '';
    }

    try {
      console.log(`[Logger Trace] POSTing interaction log to Discord...`);
      const response = await fetch(
        `https://discord.com/api/webhooks/${this.logWebhookId}/${this.logWebhookToken}?wait=true`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: sanitized }),
        }
      );

      console.log(`[Logger Trace] POST status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        console.error(`[Logger Trace ERROR] Interaction log rejected! Reason: ${errorText}`);
        return '';
      }

      const data = await response.json() as { id: string };
      this.consoleLines.set(data.id, sanitized);
      console.log(`[Logger Trace] Interaction logged successfully. Message ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[Logger Trace CRITICAL ERROR] Failed to send interaction log:', error);
      return '';
    }
  }

  static updateExecution(executionId: string, message: string): void {
    console.log(`[Logger Trace] updateExecution() called for ID: ${executionId}`);
    
    if (!executionId || !this.logWebhookId || !this.logWebhookToken) {
      console.error('[Logger Trace ABORT] Cannot update execution: Missing ID or Webhook credentials.');
      return;
    }

    const sanitized = this.sanitize(message);
    const existing = this.consoleLines.get(executionId);
    const prefix = existing ? existing.split('||')[0].trim() : '';
    const updated = `${prefix} || ${sanitized}`;

    if (existing) {
      this.consoleLines.set(executionId, updated);
      process.stdout.write(`\r${updated}\n`);
    }

    const url = `https://discord.com/api/webhooks/${this.logWebhookId}/${this.logWebhookToken}/messages/${executionId}`;
    void this.safeWebhookFetch(url, 'PATCH', { content: updated }, 'updateExecution');
  }

  static log(message: string): void {
    console.log(`[Logger Trace] log() called.`);
    const sanitized = this.sanitize(message);
    console.log(sanitized);

    if (!this.logWebhookId || !this.logWebhookToken) {
      console.error('[Logger Trace ABORT] Cannot log: logWebhookId or logWebhookToken is null.');
      return;
    }

    const url = `https://discord.com/api/webhooks/${this.logWebhookId}/${this.logWebhookToken}`;
    void this.safeWebhookFetch(url, 'POST', { content: sanitized }, 'log');
  }

  static error(message: string): void {
    console.log(`[Logger Trace] error() called.`);
    const sanitized = this.sanitize(message);
    console.error(sanitized);

    if (!this.errorWebhookUrl) {
      console.error('[Logger Trace ABORT] Cannot send error log: errorWebhookUrl is null.');
      return;
    }

    void this.safeWebhookFetch(this.errorWebhookUrl, 'POST', { content: sanitized }, 'error');
  }

  static debug(message: string): void {
    console.log(this.sanitize(message));
  }
}