import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { BotButtonInteraction, errorView } from '@vulps22/bot-interactions';
import { Handler } from '../../../utils';
import { reportConfirmationView } from '../../../views';

const reportButton: Handler<BotButtonInteraction> = {
    name: 'report',
    params: { id: 'id' },
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get(reportButton.params!.id);
        if (!questionId) {
            await interaction.ephemeralReply(errorView('Invalid question ID'));
            throw new Error('Invalid question ID when using Button: question_report');
        }

        await interaction.ephemeralReply(reportConfirmationView(questionId));
    }
};

export default reportButton;
