import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';
import { Logger } from '../../../utils';
import { questionService, votingService } from '../../../services';
import { questionEmbed } from '../../../views';

const failed: Handler<BotButtonInteraction> = {
    name: 'failed',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const messageId = interaction.message.id;
        const userId = interaction.user.id;

        try {
            const updated = await votingService.recordVote(messageId, userId, 'failed');

            const question = await questionService.getQuestionById(updated.question_id);
            if (question) {
                const updatedEmbed = questionEmbed(question, updated.done_count, updated.failed_count);
                await interaction.updateComponentMessage(null, updatedEmbed);
            }

            await interaction.ephemeralReply('❌ Voted FAILED!');
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'ALREADY_VOTED') {
                    await interaction.ephemeralReply('❌ You have already voted on this question.');
                    return;
                }
                if (error.message === 'QUESTION_FINALIZED') {
                    await interaction.ephemeralReply('❌ This question has already been finalized.');
                    return;
                }
                if (error.message === 'NO_TRACKING') {
                    await interaction.ephemeralReply('❌ Could not find tracking data for this question.');
                    return;
                }
            }
            Logger.error(`Failed handler error for message ${messageId}: ${error}`);
            await interaction.ephemeralReply('❌ Something went wrong. Please try again.');
        }
    }
};

export default failed;
