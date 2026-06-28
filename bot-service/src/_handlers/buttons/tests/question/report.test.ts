import { BotButtonInteraction, errorView } from '@vulps22/bot-interactions';
import { MessageFlags } from 'discord.js';
import reportButton from '../../question/report';

jest.mock('@vulps22/bot-interactions', () => ({
    ...jest.requireActual('@vulps22/bot-interactions'),
    errorView: jest.fn().mockReturnValue({ flags: 64, components: [] }),
}));

describe('reportButton', () => {
    let mockInteraction: jest.Mocked<BotButtonInteraction>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            params: new Map([['id', '42']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<BotButtonInteraction>;
    });

    it('should have correct name and params', () => {
        expect(reportButton.name).toBe('report');
        expect(reportButton.params).toEqual({ id: 'id' });
    });

    it('should show the report confirmation view', async () => {
        await reportButton.execute(mockInteraction);

        expect(mockInteraction.ephemeralReply).toHaveBeenCalledTimes(1);
        const message = (mockInteraction.ephemeralReply as jest.Mock).mock.calls[0][0];
        expect(message.flags).toBe(MessageFlags.IsComponentsV2);
        expect(message.components).toBeDefined();
        expect(message.components.length).toBeGreaterThan(0);
    });

    it('should include a confirm button targeting the correct question ID', async () => {
        await reportButton.execute(mockInteraction);

        const message = (mockInteraction.ephemeralReply as jest.Mock).mock.calls[0][0];
        const allComponents = message.components.flatMap((c: any) =>
            c.components ?? [c]
        );
        const confirmButton = allComponents.find((c: any) =>
            c.data?.custom_id === 'question_reportConfirmed_id:42'
        );
        expect(confirmButton).toBeDefined();
    });

    it('should throw and call ephemeralReply with errorView when question ID is missing', async () => {
        (mockInteraction.params as Map<string, string>).clear();

        await expect(reportButton.execute(mockInteraction)).rejects.toThrow(
            'Invalid question ID when using Button: question_report'
        );
        expect(errorView).toHaveBeenCalledWith('Invalid question ID');
        expect(mockInteraction.ephemeralReply).toHaveBeenCalledTimes(1);
    });
});
