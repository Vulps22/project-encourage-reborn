import { ServerProfileBuilder } from "../../../builders/ServerProfileBuilder";
import { BotButtonInteraction } from "../../../structures";
import { Handler } from "../../../utils";
import { moderationService } from "../../../services";
import { serverView } from "../../../views";
import { TargetType } from "../../../types";

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
            await interaction.message.edit(revertedView as any);
        });
    }
};

export default banServerButton;
