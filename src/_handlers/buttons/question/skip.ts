import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const skip: Handler<BotButtonInteraction> = {
    name: 'skip',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');        
        await interaction.ephemeralReply('⏭️ Skipped!');
    }
};

export default skip;
