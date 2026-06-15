/** Component V2 message displayed on a server's first interaction after the beta, announcing the live launch */

import { ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { Urls } from '../config';
import { UniversalMessage } from '@vulps22/bot-interactions';

function playtestNoticeView(): UniversalMessage {
    const title = new TextDisplayBuilder()
        .setContent(`## 🎉 Project Encourage is Now Live!`);

    const intro = new TextDisplayBuilder()
        .setContent(
            `Thank you to everyone who took part in our beta — your feedback and patience helped shape this release.\n\n` +
            `**This version of the bot is now officially live.** We won't be returning to the previous version — this is the real deal, and it's here to stay.`
        );

    const data = new TextDisplayBuilder()
        .setContent(
            `**📦 Your Data**\n` +
            `Beta data has been preserved. There's nothing you need to do — just keep playing.`
        );

    const feedback = new TextDisplayBuilder()
        .setContent(
            `**💬 Stay Connected**\n` +
            `Spotted a bug or have a suggestion? We'd love to hear from you — join our official server!\n` +
            `${Urls.OFFICIAL_SERVER}`
        );

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(intro)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(data)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(feedback);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    };

    return message;
}

export { playtestNoticeView };
