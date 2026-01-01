import { NewsChannel, PermissionFlagsBits } from 'discord.js';
import { Config } from '../../../config/Config';
import { serverService } from '../../../services';
import { BotSelectMenuInteraction } from '../../../structures';
import { Handler, Logger } from '../../../utils';
import { setupCompleteView, setupFailedView } from '../../../views';

const announcementChannelSelected: Handler<BotSelectMenuInteraction> = {
    name: 'announcementChannelSelected',
    params: {},
    async execute(interaction) {
        // Verify user is admin
        if (!interaction.interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) &&
            !interaction.interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralReply('❌ Only administrators can configure announcement channels.');
            return;
        }

        const guildId = interaction.interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralReply('❌ This can only be used in a server.');
            return;
        }

        // Get selected channel ID from the channel select menu
        const selectedChannelId = interaction.interaction.values[0];
        if (!selectedChannelId) {
            await interaction.ephemeralReply('❌ No channel was selected.');
            return;
        }

        // Defer update since we're going to do IPC call
        await interaction.interaction.deferUpdate();

        // Save the announcement channel setting
        await serverService.setAnnouncementChannel(guildId, selectedChannelId);

        // Attempt to follow the official announcement channel via IPC
        const announcementChannelId = Config.ANNOUNCEMENT_CHANNEL_ID;

        if (!announcementChannelId) {
            // Announcement channel not configured, skip IPC
            const message = setupCompleteView(selectedChannelId);
            await interaction.interaction.editReply(message);
            return;
        }

        try {
            // Use IPC to follow the announcement channel across shards
            const results = await global.client.shard!.broadcastEval(
                async (c, context) => {
                    try {
                        const officialChannel = c.channels.cache.get(context.announcementChannelId);
                        if (officialChannel?.isNewsChannel()) {
                            const newsChannel = officialChannel as NewsChannel;
                            await newsChannel.addFollower(context.targetChannelId);
                            return { success: true, error: null };
                        }
                        return { success: false, error: 'Announcement channel not found or not a news channel' };
                    } catch (err) {
                        return { success: false, error: String(err) };
                    }
                },
                {
                    context: {
                        announcementChannelId,
                        targetChannelId: selectedChannelId
                    }
                }
            );

            // Check if any shard succeeded
            const successResult = results.find(r => r && r.success);
            if (successResult) {
                // Success! Show completion message
                const message = setupCompleteView(selectedChannelId);
                await interaction.interaction.editReply(message);
            } else {
                // All shards failed
                const errorResult = results.find(r => r && r.error);
                const errorMessage = errorResult?.error || 'Unknown error';

                Logger.error(`Failed to subscribe announcement channel: ${errorMessage}`);

                const message = setupFailedView(errorMessage);
                await interaction.interaction.editReply(message);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Failed to subscribe announcement channel: ${errorMessage}`);

            const message = setupFailedView(errorMessage);
            await interaction.interaction.editReply(message);
        }
    }
};

export default announcementChannelSelected;
