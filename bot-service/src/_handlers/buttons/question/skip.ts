import { BotButtonInteraction, errorView } from '@vulps22/bot-interactions';
import { Handler } from '../../../utils';
import { Logger } from '@vulps22/logger';
import { challengeService, inventoryService, questionService, votingService } from '../../../services';
import { challengeEmbed } from '../../../views';


const skip: Handler<BotButtonInteraction> = {
    name: 'skip',
    interactionInitiator: true,
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const messageId = interaction.messageId;
        const userId = interaction.user.id;

        try {
            await interaction.deferUpdate();

            const challenge = await challengeService.getChallengeByMessageId(messageId);
            if (!challenge) {
                await interaction.ephemeralFollowUp(errorView('Could not find tracking data for this challenge.'));
                return;
            }

            if (challenge.user_id !== userId) {
                await interaction.ephemeralFollowUp(errorView('Only the challenge recipient can skip.'));
                return;
            }

            const challengeId = challenge.id;

            const challengeVote = await votingService.getVoteCount(challengeId);
            if (challengeVote.final_result !== null) {
                await interaction.ephemeralFollowUp(errorView('This challenge has already been locked.'));
                return;
            }
            const skips = await inventoryService.consume(userId, 'skip', 1);
            if(!skips) {
                await interaction.ephemeralFollowUp(errorView(`You have no skips left! You can earn more by voting at [Top.gg](<${process.env.TOPGG_URL}>).`));
                return;
            }

            await challengeService.skip(challengeId);
            const updated = await votingService.finalizeChallenge(challengeId, 'skipped');

            const question = await questionService.getQuestionById(challenge.question_id);
            if (question) {
                await interaction.updateComponentMessage(challengeEmbed(question, challenge, updated));
            }
        } catch (error) {
            Logger.error(`Skip handler error for message ${messageId}: ${error instanceof Error ? error.message : String(error)}`);
            await interaction.ephemeralFollowUp(errorView('Something went wrong. Please try again.'));
        }
    }
};

export default skip;
