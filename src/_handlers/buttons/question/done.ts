import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { Logger } from '../../../utils';
import { questionService, votingService } from '../../../services';
import { questionEmbed } from '../../../views';

const done: Handler<BotButtonInteraction> = {
    name: 'done',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const messageId = interaction.message.id;
        const userId = interaction.user.id;

        try {
            const updated = await votingService.recordVote(messageId, userId, 'done');

            const question = await questionService.getQuestionById(updated.question_id);
            if (question) {
                const updatedEmbed = questionEmbed(question, updated.done_count, updated.failed_count);
                await interaction.updateComponentMessage(null, updatedEmbed);
            }

            await interaction.ephemeralReply('✅ Voted DONE!');
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'ALREADY_VOTED') {
                    await interaction.ephemeralReply('❌ You have already voted on this question.');
                    return;
                }
                else if (error.message === 'QUESTION_FINALIZED') {
                    await interaction.ephemeralReply('❌ This question has already been locked.');
                    return;
                }
                else if (error.message === 'NO_TRACKING') {
                    await interaction.ephemeralReply('❌ Could not find tracking data for this question.');
                    return;
                }
            }
            Logger.error(`Done handler error for message ${messageId}: ${error}`);
            await interaction.ephemeralReply('❌ Something went wrong. Please try again.');
        }
    }
};

export default done;
