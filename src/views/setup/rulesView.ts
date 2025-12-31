/** Component V2 message for displaying submission rules during setup */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { UniversalMessage } from "../../types";

function rulesView(): UniversalMessage {
    const title = new TextDisplayBuilder()
        .setContent(`## **Avoiding Bans**`);

    const subtitle = new TextDisplayBuilder()
        .setContent(`Here are some tips to avoid your truths/dares being banned:`);

    const global = new TextDisplayBuilder()
        .setContent(
            `**Your submissions are _global_**\n` +
            `• We moderate and approve/ban every submission.\n` +
            `• Everything you submit with /create that gets approved could show up on any server.`
        );

    const noDangerous = new TextDisplayBuilder()
        .setContent(
            `**No Dangerous Or Illegal Content**\n` +
            `• Keep it safe and legal`
        );

    const noTargeting = new TextDisplayBuilder()
        .setContent(
            `**No Targeting Specific People**\n` +
            `• Truths/dares are global and should work for everyone`
        );

    const noMentionsGiver = new TextDisplayBuilder()
        .setContent(
            `**No Mentions Of "The Giver"**\n` +
            `• Use /give for those types of dares`
        );

    const discordGuidelines = new TextDisplayBuilder()
        .setContent(
            `**Follow Discord Guidelines**\n` +
            `• No Racism, Underage references etc.`
        );

    const useEnglish = new TextDisplayBuilder()
        .setContent(
            `**Use English**\n` +
            `• For bot language support`
        );

    const noNonsense = new TextDisplayBuilder()
        .setContent(
            `**No Nonsense Content**\n` +
            `• Avoid keyboard smashing, single letters etc`
        );

    const noChildish = new TextDisplayBuilder()
        .setContent(
            `**No Childish Content**\n` +
            `• Could be written by a child/teen, or likely to be ignored`
        );

    const noShoutouts = new TextDisplayBuilder()
        .setContent(
            `**No Shoutouts**\n` +
            `• Using names, "I am awesome!"`
        );

    const noDaresThatRequireMultiple = new TextDisplayBuilder()
        .setContent(
            `**No Dares That Require More Than One Person**\n` +
            `• This is an **online** bot!`
        );

    const checkSpelling = new TextDisplayBuilder()
        .setContent(
            `**Check Spelling And Grammar**\n` +
            `• Low-Effort content will not be accepted`
        );

    const importantNotes = new TextDisplayBuilder()
        .setContent(
            `**Important Notes**\n` +
            `• **You or your community could be banned from creating new truths and dares** if we have to repeatedly ban your submissions for similar or silly reasons.\n` +
            `• We ban submissions _often_ to maintain a high standard in the global pool. You are unlikely to be banned from creating submissions unless we feel you are abusing the system\n` +
            `• This is not a limit to the reasons why we may ban your submissions.\n` +
            `• Moderators reserve the right to ban your submissions for any reason they deem appropriate.\n` +
            `• You are free to appeal any ban if you feel it is unjust or unfair.`
        );

    // Build container
    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            subtitle,
            global,
            noDangerous,
            noTargeting,
            noMentionsGiver,
            discordGuidelines,
            useEnglish,
            noNonsense,
            noChildish,
            noShoutouts,
            noDaresThatRequireMultiple,
            checkSpelling
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(importantNotes);

    // Create Accept/Decline buttons
    const acceptButton = new ButtonBuilder()
        .setCustomId('setup_acceptRules')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
        .setCustomId('setup_declineRules')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(acceptButton, declineButton);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container, buttonRow],
    };

    return message;
}

export { rulesView };
