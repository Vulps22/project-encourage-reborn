/** Component V2 message for selecting announcement channel during setup */

import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { UniversalMessage } from "@vulps22/bot-interactions";;

function channelSelectView(): UniversalMessage {
    const title = new TextDisplayBuilder()
        .setContent(`## **Select Announcement Channel**`);

    const description = new TextDisplayBuilder()
        .setContent(
            `Please select a channel where you'd like to receive announcements about bot updates, new features, and important news.\n\n` +
            `This channel will be subscribed to our official announcement channel.`
        );

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(description);

    // Create channel selector
    const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup_announcementChannelSelected')
        .setPlaceholder('Select a channel')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(1)
        .setMaxValues(1);

    const selectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>()
        .addComponents(channelSelect);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container, selectRow],
    };

    return message;
}

export { channelSelectView };
