/** A ComponentV2 message for displaying the help menu with all available commands */

import { ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { UniversalMessage } from "../../types";

function helpView(): UniversalMessage {
    // Title
    const title = new TextDisplayBuilder()
        .setContent(`## **Help and Commands**`);

    const titleSection = new SectionBuilder()
        .addTextDisplayComponents(title);

    // Commands content
    const commandsContent = new TextDisplayBuilder()
        .setContent(
            `\n**Questions**\n` +
            `\`/truth\` - Get a random truth question\n` +
            `\`/dare\` - Get a random dare question\n` +
            `\`/create\` - Submit a custom truth or dare question\n\n` +
            `**Utility**\n` +
            `\`/help\` - Display all available commands and features\n\n` +
            `Use \`/command-name\` to execute a command`
        );

    // Assemble container
    const container = new ContainerBuilder()
        .addSectionComponents(titleSection)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(commandsContent);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    };

    return message;
}

export default helpView;
