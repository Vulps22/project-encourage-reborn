/** A ComponentV2 message for displaying the help menu with all available commands */

import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { UniversalMessage } from "../../types";

function helpView(): UniversalMessage {
    // Title
    const title = new TextDisplayBuilder()
        .setContent(`## **Truth or Dare Bot Help**`);

    // Intro text
    const intro = new TextDisplayBuilder()
        .setContent(`Here are the commands you can use with the bot:`);

    // Commands content
    const commandsContent = new TextDisplayBuilder()
        .setContent(
            `**Basic Commands**\n` +
            `- \`/truth\` - Get random truth\n` +
            `- \`/dare\` - Get random dare\n` +
            `- \`/random\` - Get random truth or dare\n\n` +
            `**Create Commands**\n` +
            `- \`/create dare\` - Add dare to pool\n` +
            `- \`/create truth\` - Add truth to pool\n\n` +
            `**Challenge Commands**\n` +
            `- \`/give dare\` - Challenge someone to a dare\n` +
            `- \`/give truth\` - Challenge someone to a truth\n` +
            `\t- Incentivise targeted player by wagering your own XP\n\n` +
            `**Report Commands**\n` +
            `- \`/report dare\` - Report inappropriate dare\n` +
            `- \`/report truth\` - Report inappropriate truth\n` +
            `- \`/report server\` - Report rule-breaking server\n\n` +
            `**Utility Commands**\n` +
            `- \`/vote\` - See a list of Bot lists where you can vote to support our bot and help it grow faster!\n` +
            `- \`/terms\` - View the Terms of Use this server has agreed to follow.\n` +
            `\t- Use \`/report server\` if this server has broken those Terms\n` +
            `- \`/help\` - See a list of available commands\n\n` +
            `**Creating Truths or Dares**\n` +
            `Everybody worldwide is welcome to create as many truths or dares as they can imagine. In fact it is encouraged!\n` +
            `The more we all create, the more variety when we play 😊\n\n` +
            `**Links**\n\n` +
            `**For news, updates and help**\t\t\t **Got your own community?**\n` +
            `[Join Our Support Server](#)\t\t\t[Add The Bot](#)\n\n` +
            `**Need More Information?**\n` +
            `[Github Wiki] (#)`
        );

    // Assemble container
    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(intro, commandsContent);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    };

    return message;
}

export default helpView;
