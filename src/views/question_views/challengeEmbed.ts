/** A ComponentV2 message for displaying a Truth or Dare question with voting buttons */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { Challenge, ChallengeVote, Question } from "../../interface";
import { UniversalMessage } from "@vulps22/bot-interactions";
import { VoteResult } from "../../types";

function challengeEmbed(question: Question, challenge: Challenge, vote: ChallengeVote): UniversalMessage {
    // Main title showing the type (Truth/Dare) in a section with report accessory button
    const title = new TextDisplayBuilder()
        .setContent(`## **${question.type.charAt(0).toUpperCase() + question.type.slice(1)}!**`);

    const reportAccessoryButton = new ButtonBuilder()
        .setCustomId(`question_report_id:${question.id}`)
        .setLabel('⚠️')
        .setStyle(ButtonStyle.Secondary);

    const titleSection = new SectionBuilder()
        .addTextDisplayComponents(title)
        .setButtonAccessory(reportAccessoryButton);

    // The actual question text
    const questionText = new TextDisplayBuilder()
        .setContent(question.question + "\n\n");

    // Voting status footer
    const votingInfo = new TextDisplayBuilder()
        .setContent(vote.final_result === VoteResult.Skipped ? `\n**Result:** Skipped` : `\n**Votes:** ${vote.done_count} Done | ${vote.failed_count} Failed`);

    // Footer with metadata
    const footer = new TextDisplayBuilder()
        .setContent(`Requested by <@${challenge.user_id}> | Created By Somebody | #${question.id}`);

    // Create the container with all components
    const container = new ContainerBuilder()
        .addSectionComponents(titleSection)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(questionText)
        .addTextDisplayComponents(votingInfo)
        .addTextDisplayComponents(footer);

    // Create action buttons
    const doneButton = new ButtonBuilder()
        .setCustomId(`question_done_id:${question.id}`)
        .setLabel('DONE')
        .setDisabled(vote.final_result !== null)
        .setStyle(ButtonStyle.Success);

    const failedButton = new ButtonBuilder()
        .setCustomId(`question_failed_id:${question.id}`)
        .setLabel('FAILED')
        .setDisabled(vote.final_result !== null)
        .setStyle(ButtonStyle.Danger);

    const skipButton = new ButtonBuilder()
        .setCustomId(`question_skip_id:${question.id}`)
        .setLabel('SKIP')
        .setDisabled(vote.final_result !== null)
        .setStyle(ButtonStyle.Secondary);

    // Add buttons to action row
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(doneButton, failedButton, skipButton);

    const message: UniversalMessage = {
        flags: MessageFlags.IsComponentsV2,
        components: [container, buttonRow],
    };

    return message;
}

export { challengeEmbed };
