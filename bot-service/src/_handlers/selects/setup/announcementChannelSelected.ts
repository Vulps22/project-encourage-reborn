import { NewsChannel, PermissionFlagsBits } from 'discord.js';
import { Config } from '../../../config';
import { serverService } from '../../../services';
import { BotSelectMenuInteraction, errorView } from '@vulps22/bot-interactions';
import { Handler } from '../../../utils';
import { Logger } from '@vulps22/logger';
import { setupCompleteView, setupFailedView } from '../../../views';

const announcementChannelSelected: Handler<BotSelectMenuInteraction> = {
    name: 'announcementChannelSelected',
    params: {},
    interactionInitiator: false,
    async execute(interaction) {
        await interaction.deferUpdate();
        // Verify user is admin
        const member = interaction.member;
        if (!member || !('permissions' in member)) {
            await interaction.ephemeralFollowUp(errorView('Only administrators can configure announcement channels.'));
            return;
        }
        
        const permissions = member.permissions;
        if (typeof permissions === 'string') {
            await interaction.ephemeralFollowUp(errorView('Only administrators can configure announcement channels.'));
            return;
        }
        
        if (!permissions.has(PermissionFlagsBits.Administrator) &&
            !permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.ephemeralFollowUp(errorView('Only administrators can configure announcement channels.'));
            return;
        }

        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.ephemeralFollowUp(errorView('This can only be used in a server.'));
            return;
        }

        // Get selected channel ID from the channel select menu
        const selectedChannelId = interaction.values[0];
        if (!selectedChannelId) {
            await interaction.ephemeralFollowUp(errorView('No channel was selected.'));
            return;
        }

        await serverService.setAnnouncementChannel(guildId, selectedChannelId);

        const announcementChannelId = Config.ANNOUNCEMENT_CHANNEL_ID;

        if (!announcementChannelId) {
            const message = setupCompleteView(selectedChannelId);
            await interaction.update(message);
            return;
        }

        try {
            // Use IPC to follow the announcement channel across shards
            const results = await global.client.shard!.broadcastEval(
                async (c, context) => {
                    try {
                        const officialChannel = c.channels.cache.get(context.announcementChannelId);
                        if (officialChannel && officialChannel.type === 5) { // 5 = GUILD_NEWS
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
                await interaction.update(message);
            } else {
                // All shards failed
                const errorResult = results.find(r => r && r.error);
                const errorMessage = errorResult?.error || 'Unknown error';

                Logger.error(`Failed to subscribe announcement channel: ${errorMessage}`);

                const message = setupFailedView(errorMessage);
                await interaction.update(message);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            Logger.error(`Failed to subscribe announcement channel: ${errorMessage}`);

            const message = setupFailedView(errorMessage);
            await interaction.update(message);
        }
    }
};

export default announcementChannelSelected;
