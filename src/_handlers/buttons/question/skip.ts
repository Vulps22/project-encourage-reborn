import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const skip: Handler<BotButtonInteraction> = {
    name: 'skip',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');
        
        console.log(`User ${interaction.user.id} clicked SKIP on question ${questionId}`);
        
        await interaction.reply({
            content: '⏭️ Skipped!',
            ephemeral: true,
        });
    }
};

export default skip;
