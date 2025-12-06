import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const failed: Handler<BotButtonInteraction> = {
    name: 'failed',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');
        
        console.log(`User ${interaction.user.id} clicked FAILED on question ${questionId}`);
        
        await interaction.reply({
            content: '❌ Marked as FAILED!',
            ephemeral: true,
        });
    }
};

export default failed;
