import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { Handler, Logger } from '../../../utils';
import { challengeService, configurationService, questionService, votingService } from '../../../services';
import { DSError } from '../../../client';
import { challengeEmbed } from '../../../views';

const failed: Handler<BotButtonInteraction> = {
    name: 'failed',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const messageId = interaction.messageId;
        const userId = interaction.user.id;

        try {
            const challenge = await challengeService.getChallengeByMessageId(messageId);
            if (!challenge) {
                await interaction.ephemeralReply('❌ Could not find tracking data for this challenge.');
                return;
            }

            const challengeId = challenge.id;

            const challengeVote = await votingService.getVoteCount(challengeId);
            if (challengeVote.final_result !== null) {
                await interaction.ephemeralReply('❌ This challenge has already been locked.');
                return;
            }

            let updated;
            try {
                updated = await votingService.vote(challengeId, userId, 'failed');
            } catch (error) {
                if (error instanceof DSError && error.status === 409) {
                    await interaction.ephemeralReply('❌ You have already voted on this question.');
                    return;
                }
                throw error;
            }

            const threshold = await configurationService.getVoteThreshold();
            if (updated.failed_count >= threshold) {
                updated = await votingService.finalizeChallenge(challengeId, 'failed');
            }

            const question = await questionService.getQuestionById(challenge.question_id);
            if (question) {
                await interaction.updateComponentMessage(null, challengeEmbed(question, challenge, updated));
            }

            await interaction.ephemeralFollowUp('❌ Voted FAILED!');
        } catch (error) {
            Logger.error(`Failed handler error for message ${messageId}: ${error instanceof Error ? error.message : String(error)}`);
            await interaction.ephemeralFollowUp('❌ Something went wrong. Please try again.');
        }
    }
};

export default failed;
