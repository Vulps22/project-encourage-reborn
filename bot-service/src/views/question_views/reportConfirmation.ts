import { UniversalMessage } from "@vulps22/bot-interactions";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, TextDisplayBuilder } from "discord.js";

function reportConfirmationView(questionId: string): UniversalMessage {

    const text = new TextDisplayBuilder()
        .setContent(
            `⚠️ By clicking continue you are confirming that you want to report this question for violating the rules.
            \n Rules can be reviewed by executing the command \`/rules\` in any channel.
            \n **DO NOT** use the report feature to answer Challenges. These reports are sent to _bot moderators and developers_ for review.
            \n Abuse of this feature may result in restricted access to bot features or even a ban from using the bot globally.
            \n\n Are you sure you want to report this question?`
        );

    const confirmButton = new ButtonBuilder()
        .setCustomId(`question_reportConfirmed_id:${questionId}`)
        .setLabel('✅ Confirm Report')
        .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(confirmButton);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [text, actionRow],
    }

    return message;
}

export { reportConfirmationView };