import { MessageCreateOptions, TextChannel } from "discord.js";
import { Config } from "../../../bot/config";
import { BotButtonInteraction } from "@vulps22/bot-interactions";
import { Handler } from "../../../bot/utils";
import { userProfileView } from "../../../views";
import { UserProfileBuilder } from "../../../bot/builders/UserProfileBuilder";

const sendToModeratorsButton: Handler<BotButtonInteraction> = {
    name: "sendToModerators",
    params: { 'ID': 'id' },
    async execute(interaction) {
        const userId = interaction.params.get(sendToModeratorsButton.params!.ID);
        if(!userId) {
            await interaction.ephemeralReply('❌ Invalid user ID');
            throw new Error('Invalid user ID when using Button: moderation_sendToModerators');
        }
        const profile = await new UserProfileBuilder().getUserProfile(userId);
        if(!profile) {
            await interaction.ephemeralReply('❌ User not found');
            return;
        }

        const view = await userProfileView(profile);
        const channel = await interaction.client.channels.fetch(Config.MOD_CHAT_CHANNEL_ID);
        if(!channel || !channel.isTextBased()) {
            await interaction.ephemeralReply('❌ Mod chat channel not found');
            throw new Error('Mod chat channel not found when using Button: moderation_sendToModerators');
        }
        const message = await (channel as TextChannel).send(view as MessageCreateOptions);

        // Build a jump link to the sent message and include it in the ephemeral reply
        const guildId = (channel as TextChannel).guildId || '@me';
        const messageLink = `https://discord.com/channels/${guildId}/${channel.id}/${message.id}`;

        await interaction.ephemeralReply(`✅ User profile sent to mod chat — [Go To Message](${messageLink})`);
    }
};

export default sendToModeratorsButton;