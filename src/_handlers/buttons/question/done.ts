import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const done: Handler<BotButtonInteraction> = {
    name: 'done',
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get('id');        
        await interaction.ephemeralReply('✅ Marked as DONE!');
    }
};

export default done;
