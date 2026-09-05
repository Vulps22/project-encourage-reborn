import { BotButtonInteraction, errorView } from '@vulps22/bot-interactions';
import reportConfirmedButton from '../../question/report_confirmed';

jest.mock('@vulps22/bot-interactions', () => ({
    ...jest.requireActual('@vulps22/bot-interactions'),
    errorView: jest.fn().mockReturnValue({ flags: 64, components: [] }),
}));

describe('reportConfirmedButton', () => {
    let mockInteraction: jest.Mocked<BotButtonInteraction>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            params: new Map([['id', '42']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            showModal: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<BotButtonInteraction>;
    });

    it('should have correct name and params', () => {
        expect(reportConfirmedButton.name).toBe('reportConfirmed');
        expect(reportConfirmedButton.interactionInitiator).toBe(false);
        expect(reportConfirmedButton.params).toEqual({ id: 'id' });
    });

    it('should show the report reason modal', async () => {
        await reportConfirmedButton.execute(mockInteraction);

        expect(mockInteraction.showModal).toHaveBeenCalledTimes(1);
        const modal = (mockInteraction.showModal as jest.Mock).mock.calls[0][0];
        expect(modal.data.custom_id).toBe('question_reportModal_id:42');
        expect(modal.data.title).toBe('Report Question');
    });

    it('should include a text input with correct settings', async () => {
        await reportConfirmedButton.execute(mockInteraction);

        const modal = (mockInteraction.showModal as jest.Mock).mock.calls[0][0];
        const row = modal.components[0];
        const input = row.components[0];
        expect(input.data.custom_id).toBe('reason');
        expect(input.data.min_length).toBe(10);
        expect(input.data.max_length).toBe(500);
        expect(input.data.required).toBe(true);
    });

    it('should throw and call ephemeralReply with errorView when question ID is missing', async () => {
        (mockInteraction.params as Map<string, string>).clear();

        await expect(reportConfirmedButton.execute(mockInteraction)).rejects.toThrow(
            'Invalid question ID when using Button: question_report'
        );
        expect(errorView).toHaveBeenCalledWith('Invalid question ID');
        expect(mockInteraction.ephemeralReply).toHaveBeenCalledTimes(1);
        expect(mockInteraction.showModal).not.toHaveBeenCalled();
    });
});
