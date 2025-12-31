import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const done: Handler<BotButtonInteraction> = {
    name: 'done',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');
        console.log(`Question ID marked as done: ${questionId}`); // This place holder allows the bot to run before we implement the full function
        await interaction.ephemeralReply('✅ Marked as DONE!');
    }
};

export default done;
