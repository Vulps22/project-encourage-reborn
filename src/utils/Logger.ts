import { BaseInteraction, Message, MessageCreateOptions, Snowflake, TextChannel } from 'discord.js';
import { UniversalMessage } from '../types';
import { Question } from '../interface';


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
      const logChannelId = global.config.LOG_CHANNEL_ID;
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

      const logChannelId = global.config.LOG_CHANNEL_ID;
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
    const logChannelId = global.config.LOG_CHANNEL_ID;
    if (!logChannelId) {
      return;
    }
    
    await this.logTo(logChannelId, message);
  }

  /**
   * Send a message to any channel in the official guild (STREAMER SAFE - auto-redacts sensitive data)
   * @param channelId The channel ID to send to
   * @param message The message content to send
   */
  static async logTo(channelId: string, message: string | UniversalMessage): Promise<void> {
    try {
      if (!channelId) {
        return;
      }

      // Sanitize string messages, pass MessagePayload as-is
      const messageData = typeof message === 'string' ? this.sanitize(message) : message;

      // Send message via the correct shard
      await global.client.shard!.broadcastEval(
        async (c, context) => {
          const ch = await c.channels.fetch(context.channelId).catch(() => null);
          if (ch && ch.isTextBased()) {
            await (ch as TextChannel).send(context.msg as any);
            return true;
          }
          return false;
        },
        { context: { channelId: channelId, msg: messageData } }
      );
    } catch (error) {
      console.error(`Failed to send message to channel ${channelId}:`, error);
    }
  }

  // Inside Logger
static async logQuestion(question: Question, channelId: Snowflake): Promise<Message | null> {
  
  const results = await global.client.shard!.broadcastEval(
    async (c, context) => {
      const ch = c.channels.cache.get(context.channelId);
      if (ch?.isTextBased()) {
        // Import view function using absolute path1`
        const path = await import('path');
        const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'newQuestionView.js');
        const { newQuestionView } = await import(viewPath);

        // Reconstruct dates from serialized strings
        const questionData = {
          ...context.question,
          datetime_approved: context.question.datetime_approved ? new Date(context.question.datetime_approved) : null,
          datetime_banned: context.question.datetime_banned ? new Date(context.question.datetime_banned) : null,
          datetime_deleted: context.question.datetime_deleted ? new Date(context.question.datetime_deleted) : null,
          created: new Date(context.question.created)
        };
        
        const view = await newQuestionView(questionData);
        const sentMessage = await (ch as TextChannel).send(view as MessageCreateOptions);
        return sentMessage;
      }
      return null;
    },
    { 
      context: { 
        channelId: channelId, 
        question: question
      } 
    }
  );
  
  // Return the first non-null message from the shards
  return results.find(result => result !== null) as Message || null;
}

static async updateQuestionLog(question: Question, channelId: Snowflake, reasons: {}[] | null = null): Promise<Message | null> {
  this.debug(`Updating question log for question ID ${question.id} in channel ${channelId}`);
  if (!question.message_id) {
    return null;
  }

  const results = await global.client.shard!.broadcastEval(
    async (c, context) => {
      const ch = c.channels.cache.get(context.channelId);
      if (ch?.isTextBased()) {
        try {
          // Fetch the existing message
          const existingMessage = await (ch as TextChannel).messages.fetch(context.messageId);
          if (!existingMessage) {
            return { success: false, error: 'Message not found', message: null };
          }

          // Import view function using absolute path
          const path = await import('path');
          const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'newQuestionView.js');
          const { newQuestionView } = await import(viewPath);

          // Reconstruct dates from serialized strings
          const questionData = {
            ...context.question,
            datetime_approved: context.question.datetime_approved ? new Date(context.question.datetime_approved) : null,
            datetime_banned: context.question.datetime_banned ? new Date(context.question.datetime_banned) : null,
            datetime_deleted: context.question.datetime_deleted ? new Date(context.question.datetime_deleted) : null,
            created: new Date(context.question.created)
          };
          
          const view = await newQuestionView(questionData, context.reasons);
          const updatedMessage = await existingMessage.edit(view as any);
          return { success: true, error: null, message: updatedMessage };
        } catch (err) {
          console.error('Failed to update question log:', err);
          return { success: false, error: String(err), message: null };
        }
      }
      return { success: false, error: 'Channel not found or not text-based', message: null };
    },
    { 
      context: { 
        channelId: channelId, 
        question: question,
        messageId: question.message_id,
        reasons: reasons
      } 
    }
  );
  
  // Handle errors in parent context with Logger
  const errorResult = results.find(r => r && !r.success);
  if (errorResult) {
    this.error(`Failed to update question log: ${errorResult.error}`);
  }
  
  // Return the first successful message from the shards
  const successResult = results.find(result => result && result.success);
  return (successResult ? successResult.message : null) as Message | null;
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
    //throw new Error("Not Implemented Yet");
  }
}
