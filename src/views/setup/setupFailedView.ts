/** Component V2 message for setup failure (IPC error) */

import { ContainerBuilder, InteractionUpdateOptions, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";

function setupFailedView(error: string): InteractionUpdateOptions {
    const title = new TextDisplayBuilder()
        .setContent(`## ⚠️ **Setup Incomplete**`);

    const description = new TextDisplayBuilder()
        .setContent(
            `Your server configuration was saved, but we encountered an issue:\n\n` +
            `**Error:** ${error}\n\n` +
            `**What this means:**\n` +
            `• Your server is configured and ready to use\n` +
            `• However, we couldn't subscribe your announcement channel to our official updates\n` +
            `• You'll miss out on important news and feature announcements\n\n` +
            `**How to fix:**\n` +
            `Please try again later with \`/set announcement_channel\` to complete the subscription.`
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

export { setupFailedView };
