/** Component V2 message for successful setup completion */

import { ContainerBuilder, InteractionUpdateOptions, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";

function setupCompleteView(announcementChannelId: string): InteractionUpdateOptions {
    const title = new TextDisplayBuilder()
        .setContent(`## ✅ **Setup Complete!**`);

    const description = new TextDisplayBuilder()
        .setContent(
            `Your server has been successfully configured!\n\n` +
            `**Configuration:**\n` +
            `• Terms and Conditions: Accepted\n` +
            `• Submission Rules: Reviewed\n` +
            `• Announcement Channel: <#${announcementChannelId}>\n\n` +
            `You can now use all bot features. Have fun!`
        );

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(description);

    const message: InteractionUpdateOptions = {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    };

    return message;
}

export { setupCompleteView };
