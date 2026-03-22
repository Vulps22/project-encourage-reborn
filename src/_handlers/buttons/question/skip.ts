import { BotButtonInteraction } from '../../../structures';
import { Handler, Logger } from '../../../utils';
import { challengeService, questionService, votingService } from '../../../services';
import { challengeEmbed } from '../../../views';

const skip: Handler<BotButtonInteraction> = {
    name: 'skip',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const messageId = interaction.messageId;
        const userId = interaction.user.id;

        try {
            const challenge = await challengeService.getChallengeByMessageId(messageId);
            if (!challenge) {
                await interaction.ephemeralReply('❌ Could not find tracking data for this challenge.');
                return;
            }

            if (challenge.user_id !== userId) {
                await interaction.ephemeralReply('❌ Only the challenge recipient can skip.');
                return;
            }

            const challengeId = challenge.id;

            const challengeVote = await votingService.getVoteCount(challengeId);
            if (challengeVote.final_result !== null) {
                await interaction.ephemeralReply('❌ This challenge has already been locked.');
                return;
            }

            await challengeService.skip(challengeId);
            const updated = await votingService.finalizeChallenge(challengeId, 'skipped');

            const question = await questionService.getQuestionById(challenge.question_id);
            if (question) {
                await interaction.updateComponentMessage(null, challengeEmbed(question, challenge, updated));
            }

            await interaction.ephemeralFollowUp('⏭️ Challenge skipped.');
        } catch (error) {
            Logger.error(`Skip handler error for message ${messageId}: ${error instanceof Error ? error.message : String(error)}`);
            await interaction.ephemeralFollowUp('❌ Something went wrong. Please try again.');
        }
    }
};

export default skip;
