import { ServerProfileBuilder } from "../../../bot/builders/ServerProfileBuilder";
import { BotButtonInteraction } from "@vulps22/bot-interactions";
import { Handler } from "../../../bot/utils";
import { moderationService } from "../../../services";
import { serverView } from "../../../views";
import { TargetType } from "@vulps22/project-encourage-types";
import { MessageEditOptions } from "discord.js";

const banServerButton: Handler<BotButtonInteraction> = {
    name: "banServer",
    params: { id: 'id' },
    async execute(interaction) {
        const serverId = interaction.params.get(banServerButton.params!.id);
        if (!serverId) {
            await interaction.ephemeralReply('❌ Invalid server ID');
            throw new Error('Invalid server ID when using Button: moderation_banServer');
        }

        const profile = await new ServerProfileBuilder().getServerProfile(serverId);
        if (!profile) {
            await interaction.ephemeralReply('❌ Server not found');
            return;
        }

        const reasons = moderationService.getBanReasons(TargetType.Server);
        const view = await serverView(profile, reasons as []);
        await interaction.updateComponentMessage(null, view);

        interaction.message.awaitMessageComponent({
            filter: i => i.customId.startsWith(`moderation_serverBanReasonSelected`),
            time: 60_000
        }).catch(async () => {
            const revertedView = await serverView(profile);
            await interaction.message.edit(revertedView as unknown as MessageEditOptions);
        });
    }
};

export default banServerButton;
