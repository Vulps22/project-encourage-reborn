/** A ComponentV2 Embed for New Question Submission Confirmation */

import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { Question } from "../../interface";
import { UniversalMessage } from "../../types";

function confirmNewQuestionEmbed(question: Question): UniversalMessage {

    const title = new TextDisplayBuilder()
    .setContent(`✅ New ${question.type.charAt(0).toUpperCase() + question.type.slice(1)} Submitted!`);

    const description = new TextDisplayBuilder()
    .setContent(question.question);

    const footer = new TextDisplayBuilder()
    .setContent(`ID: ${question.id} | Submitted by User ID: <@${question.user_id}>`);

    const container = new ContainerBuilder()
    .addTextDisplayComponents(title)
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(description)
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(footer);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
    }

    return message;

}

export { confirmNewQuestionEmbed };