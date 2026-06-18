import { ServerProfileBuilder } from "../../../bot/builders/ServerProfileBuilder";
import { BotButtonInteraction, errorView } from "@vulps22/bot-interactions";
import { Handler, ModerationLogger } from "../../../bot/utils";
import { serverService } from "../../../services";

const unbanServerButton: Handler<BotButtonInteraction> = {
    name: "unbanServer",
    params: { id: 'id' },
    async execute(interaction) {
        const serverId = interaction.params.get(unbanServerButton.params!.id);
        if (!serverId) {
            await interaction.ephemeralReply(errorView('Invalid server ID'));
            throw new Error('Invalid server ID when using Button: moderation_unbanServer');
        }

        await serverService.updateServerSettings(serverId, {
            is_banned: false,
            ban_reason: null
        });

        const profile = await new ServerProfileBuilder().getServerProfile(serverId);
        if (!profile) {
            await interaction.ephemeralReply(errorView('Server not found'));
            return;
        }

        await ModerationLogger.updateServerLog(profile);
    }
};

export default unbanServerButton;
