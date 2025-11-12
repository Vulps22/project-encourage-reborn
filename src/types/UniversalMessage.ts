import { InteractionEditReplyOptions, InteractionReplyOptions, MessageCreateOptions } from "discord.js";

export type UniversalMessage = InteractionReplyOptions | InteractionEditReplyOptions | MessageCreateOptions;
