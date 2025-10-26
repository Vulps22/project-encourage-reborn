import { BaseInteraction, TextChannel } from 'discord.js';

/**
 * Logger - Static utility for logging bot execution to Discord
 * 
 * Sends log messages to a dedicated Discord channel and tracks execution flow
 * by editing messages as status changes occur.
 */
export class Logger {
  private static sensitiveValues: Set<string> = new Set();

  /**
   * Initialize the logger by caching all sensitive values from environment variables
   * Call this once at bot startup
   */
  static initialize(): void {
    // Cache all non-empty env values as sensitive
    for (const value of Object.values(process.env)) {
      if (value && value.length > 0) {
        this.sensitiveValues.add(value);
      }
    }
  }

  /**
   * Sanitize a message by replacing all sensitive values with 'xxxxxxxxxxxx'
   * @param message The message to sanitize
   * @returns The sanitized message safe for streaming
   */
  private static sanitize(message: string): string {
    let sanitized = message;
    
    // Replace each sensitive value with xxxxxxxxxxxx
    for (const sensitive of this.sensitiveValues) {
      // Escape special regex characters in the sensitive value
      const escaped = sensitive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      sanitized = sanitized.replace(regex, 'xxxxxxxxxxxx');
    }
    
    return sanitized;
  }

  /**
   * Log that an interaction was received
   * @param interaction Discord interaction object
   * @returns ExecutionId (Discord message ID) for tracking this execution
   */
  static async logInteractionReceived(interaction: BaseInteraction): Promise<string> {
    try {
      const logChannelId = process.env.LOG_CHANNEL_ID;
      if (!logChannelId) {
        return '';
      }

      // Find the shard that has the log channel
      const results = await global.client.shard!.broadcastEval(
        async (c, channelId) => {
          const ch = await c.channels.fetch(channelId as string).catch(() => null);
          return ch ? { found: true, shardId: c.shard?.ids[0] || 0 } : { found: false, shardId: 0 };
        },
        { context: logChannelId }
      );

      const shardWithChannel = results.find(r => r.found);
      if (!shardWithChannel) {
        return '';
      }

      const msg = `Interaction Received | Server: ${interaction.guild?.name || 'DM'} - ${interaction.guild?.id || 'N/A'} | User: ${interaction.user.username} - ${interaction.user.id} || Processing`;

      // Send message via the correct shard
      const messageIds = await global.client.shard!.broadcastEval(
        async (c, context) => {
          const ch = await c.channels.fetch(context.channelId).catch(() => null);
          if (ch && ch.isTextBased()) {
            const sent = await (ch as TextChannel).send(context.msg);
            return sent.id;
          }
          return null;
        },
        { context: { channelId: logChannelId, msg } }
      );

      const messageId = messageIds.find(id => id !== null);
      return messageId || '';
    } catch (error) {
      console.error('Failed to log interaction:', error);
      return '';
    }
  }

  /**
   * Update an execution log with new message content
   * @param executionId Discord message ID
   * @param message New message content
   */
  static async updateExecution(executionId: string, message: string): Promise<void> {
    try {
      if (!executionId) {
        return;
      }

      const logChannelId = process.env.LOG_CHANNEL_ID;
      if (!logChannelId) {
        return;
      }

      // Sanitize the message before sending
      const sanitized = this.sanitize(message);

      // Find and update message via the correct shard
      await global.client.shard!.broadcastEval(
        async (c, { channelId, msgId, newMsg }) => {
          const ch = await c.channels.fetch(channelId).catch(() => null);
          if (ch && ch.isTextBased()) {
            const msg = await ch.messages.fetch(msgId).catch(() => null);
            if (msg) {
              await msg.edit(newMsg);
              return true;
            }
          }
          return false;
        },
        { context: { channelId: logChannelId, msgId: executionId, newMsg: sanitized } }
      );
    } catch (error) {
      console.error('Failed to update execution log:', error);
    }
  }

  /**
   * Send a log message to the log channel (STREAMER SAFE - auto-redacts sensitive data)
   * @param message Message to log
   */
  static async log(message: string): Promise<void> {
    try {
      const logChannelId = process.env.LOG_CHANNEL_ID;
      if (!logChannelId) {
        return;
      }

      // Sanitize the message before sending
      const sanitized = this.sanitize(message);

      // Send message via the correct shard
      await global.client.shard!.broadcastEval(
        async (c, context) => {
          const ch = await c.channels.fetch(context.channelId).catch(() => null);
          if (ch && ch.isTextBased()) {
            await (ch as TextChannel).send(context.msg);
            return true;
          }
          return false;
        },
        { context: { channelId: logChannelId, msg: sanitized } }
      );
    } catch (error) {
      console.error('Failed to send log message:', error);
    }
  }

  /**
   * Debug logging to console (STREAMER SAFE - auto-redacts sensitive data)
   * Replaces console.log with automatic sanitization of sensitive values
   * @param message Message to log to console
   */
  static debug(message: string): void {
    const sanitized = this.sanitize(message);
    console.log(sanitized);
  }

  /**
   * Error logging to both console and discord
   * @param message the message to display
   * @throws Error with "Not Implemented Yet"
   */
  static error(message: string): void {
    console.error(this.sanitize(message));
    throw new Error("Not Implemented Yet");
  }
}
