/** A ComponentV2 message for displaying the help menu with all available commands */

import { ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { UniversalMessage } from "../../types";

function helpView(): UniversalMessage {
    // Title section
    const title = new TextDisplayBuilder()
        .setContent(`## **Truth or Dare Bot - Help**`);

    const titleSection = new SectionBuilder()
        .addTextDisplayComponents(title);

    // Create container
    const container = new ContainerBuilder()
        .addSectionComponents(titleSection)
        .addSeparatorComponents(new SeparatorBuilder());

    // Questions category
    const questionsHeader = new TextDisplayBuilder()
        .setContent(`\n**Questions**`);
    container.addTextDisplayComponents(questionsHeader);

    const truthCmd = new TextDisplayBuilder()
        .setContent(`\`/truth\` - Get a random truth question`);
    container.addTextDisplayComponents(truthCmd);

    const dareCmd = new TextDisplayBuilder()
        .setContent(`\`/dare\` - Get a random dare question`);
    container.addTextDisplayComponents(dareCmd);

    const createCmd = new TextDisplayBuilder()
        .setContent(`\`/create\` - Submit a custom truth or dare question`);
    container.addTextDisplayComponents(createCmd);

    // Utility category
    const utilityHeader = new TextDisplayBuilder()
        .setContent(`\n**Utility**`);
    container.addTextDisplayComponents(utilityHeader);

    const helpCmd = new TextDisplayBuilder()
        .setContent(`\`/help\` - Display all available commands and features`);
    container.addTextDisplayComponents(helpCmd);

    // Footer
    const footer = new TextDisplayBuilder()
        .setContent(`\n\nUse \`/command-name\` to execute a command`);
    container.addTextDisplayComponents(footer);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    };

    return message;
}

export default helpView;
