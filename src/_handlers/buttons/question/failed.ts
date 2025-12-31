import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const failed: Handler<BotButtonInteraction> = {
    name: 'failed',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');
        console.log(`Question ID marked as failed: ${questionId}`); // This place holder allows the bot to run before we implement the full function 

        await interaction.ephemeralReply('❌ Marked as FAILED!');
    }
};

export default failed;
