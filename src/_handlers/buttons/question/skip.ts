import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const skip: Handler<BotButtonInteraction> = {
    name: 'skip',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');
        console.log(`Question ID marked as skipped: ${questionId}`); // This place holder allows the bot to run before we implement the full function 

        await interaction.ephemeralReply('⏭️ Skipped!');
    }
};

export default skip;
