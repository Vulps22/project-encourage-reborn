import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { BotButtonInteraction } from '../../../structures';
import { Handler } from '../../../utils';

const reportButton: Handler<BotButtonInteraction> = {
    name: 'report',
    params: { id: 'id' },
    async execute(interaction: BotButtonInteraction): Promise<void> {
        const questionId = interaction.params.get(reportButton.params!.id);
        if (!questionId) {
            await interaction.ephemeralReply('❌ Invalid question ID');
            throw new Error('Invalid question ID when using Button: question_report');
        }

        const modal = new ModalBuilder()
            .setCustomId(`question_reportModal_id:${questionId}`)
            .setTitle('Report Question')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('reason')
                        .setLabel('Why are you reporting this?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(10)
                        .setMaxLength(500)
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }
};

export default reportButton;
