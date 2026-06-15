/** Component V2 message displayed on a server's first interaction during the playtest */

import { ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { Urls } from '../bot/config';
import { UniversalMessage } from '@vulps22/bot-interactions';

function playtestNoticeView(): UniversalMessage {
    const title = new TextDisplayBuilder()
        .setContent(`## 🧪 Playtest Notice`);

    const intro = new TextDisplayBuilder()
        .setContent(
            `You are using a **playtest version** of the bot. ` +
            `This playtest runs from <t:1775260800:F> to <t:1775347200:F>.\n\n` +
            `When the playtest ends, **all data will be wiped** and the live version of the bot will be restored. ` +
            `You will need to run setup again at that point.`
        );

    const moderation = new TextDisplayBuilder()
        .setContent(
            `**⚠️ Moderation During the Playtest**\n` +
            `Moderation will be intentionally inconsistent during this period. Questions may be banned for reasons that don't make sense, or for no reason at all, as we test the moderation system. This is expected behaviour.`
        );

    const participation = new TextDisplayBuilder()
        .setContent(
            `**✅ What You Should Do**\n` +
            `You are actively encouraged to press every button and run every available command. ` +
            `You will not be penalised for doing so, unless you break Discord's ToS or the law.`
        );

    const logging = new TextDisplayBuilder()
        .setContent(
            `**📋 Logging**\n` +
            `All interactions with the bot will be logged and reviewed after the playtest. Any errors that arise will also be captured and reviewed.`
        );

    const feedback = new TextDisplayBuilder()
        .setContent(
            `**💬 Feedback**\n` +
            `Found a bug or have a suggestion? Join our official server and let us know!\n` +
            `${Urls.OFFICIAL_SERVER}`
        );

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(intro)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(moderation, participation, logging)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(feedback);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    };

    return message;
}

export { playtestNoticeView };
