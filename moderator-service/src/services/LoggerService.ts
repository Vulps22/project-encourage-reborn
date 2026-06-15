import { Message, MessageCreateOptions, MessageEditOptions, TextChannel } from "discord.js";
import { UniversalMessage } from "@vulps22/bot-interactions";

export class LoggerService {
  private static async resolveChannel(channelId: string): Promise<TextChannel> {
    const channel = await global.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) {
      throw new Error(`Channel ${channelId} is not a fetchable text channel`);
    }
    return channel;
  }

  static async postTo(channelId: string, message: UniversalMessage): Promise<Message> {
    console.log(`[DEBUG MS/LoggerService] postTo — channelId=${channelId}`);
    const channel = await LoggerService.resolveChannel(channelId);
    console.log(`[DEBUG MS/LoggerService] Channel resolved — name=${channel.name} calling channel.send()`);
    const posted = await channel.send(message as MessageCreateOptions);
    console.log(`[DEBUG MS/LoggerService] channel.send() succeeded — messageId=${posted.id}`);
    return posted;
  }

  static async update(
    channelId: string,
    messageId: string,
    message: Partial<UniversalMessage>
  ): Promise<Message> {
    const channel = await LoggerService.resolveChannel(channelId);
    const existing = await channel.messages.fetch(messageId);
    return existing.edit(message as MessageEditOptions);
  }

  static async delete(channelId: string, messageId: string): Promise<void> {
    const channel = await LoggerService.resolveChannel(channelId);
    const existing = await channel.messages.fetch(messageId);
    await existing.delete();
  }
}
