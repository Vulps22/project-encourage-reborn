import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const skip: Handler<BotButtonInteraction> = {
    name: 'skip',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');        
        await interaction.reply({
            content: '⏭️ Skipped!',
            ephemeral: true,
        });
    }
};

export default skip;
