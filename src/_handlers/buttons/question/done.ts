import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const done: Handler<BotButtonInteraction> = {
    name: 'done',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');
        
        console.log(`User ${interaction.user.id} clicked DONE on question ${questionId}`);
        
        await interaction.reply({
            content: '✅ Marked as DONE!',
            ephemeral: true,
        });
    }
};

export default done;
