import customBanReason from '../../moderation/customBanReason';
import { BotModalInteraction } from '@vulps22/bot-interactions';
import { Logger } from '../../../../bot/utils';
import { applyBan } from '../../../shared/applyBan';

jest.mock('../../../shared/applyBan', () => ({
    applyBan: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../bot/utils', () => ({
    Logger: {
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

const mockApplyBan = applyBan as jest.MockedFunction<typeof applyBan>;
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe('customBanReason modal handler', () => {
    let mockModalInteraction: jest.Mocked<BotModalInteraction>;

    const buildInteraction = (params: [string, string][], reason = 'Repeatedly ignoring warnings') => ({
        user: { id: '123456789012345678' },
        params: new Map(params),
        fields: { getTextInputValue: jest.fn().mockReturnValue(reason) },
        ephemeralReply: jest.fn().mockResolvedValue(undefined),
    } as any);

    beforeEach(() => {
        jest.clearAllMocks();
        mockApplyBan.mockResolvedValue(undefined);
        mockModalInteraction = buildInteraction([['type', 'question'], ['id', '123']]);
    });

    it('should have correct handler structure', () => {
        expect(customBanReason.name).toBe('customBanReason');
        expect(customBanReason.interactionInitiator).toBe(false);
        expect(typeof customBanReason.execute).toBe('function');
    });

    it('should apply the ban using the typed reason', async () => {
        await customBanReason.execute(mockModalInteraction);

        expect(mockApplyBan).toHaveBeenCalledWith('question', '123', 'Repeatedly ignoring warnings', '123456789012345678');
        expect(mockModalInteraction.ephemeralReply).toHaveBeenCalled();
    });

    it.each([
        ['question', '123'],
        ['server', '1079206786021732412'],
        ['user', '914368203482890240'],
    ])('should route %s bans to applyBan', async (type, id) => {
        const interaction = buildInteraction([['type', type], ['id', id]]);

        await customBanReason.execute(interaction);

        expect(mockApplyBan).toHaveBeenCalledWith(type, id, expect.any(String), '123456789012345678');
    });

    it('should reject an unrecognised target type without banning', async () => {
        const interaction = buildInteraction([['type', 'channel'], ['id', '123']]);

        await customBanReason.execute(interaction);

        expect(mockApplyBan).not.toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalled();
        expect(interaction.ephemeralReply).toHaveBeenCalled();
    });

    it('should reject a missing target id without banning', async () => {
        const interaction = buildInteraction([['type', 'question']]);

        await customBanReason.execute(interaction);

        expect(mockApplyBan).not.toHaveBeenCalled();
        expect(interaction.ephemeralReply).toHaveBeenCalled();
    });

    it('should reject a blank reason without banning', async () => {
        const interaction = buildInteraction([['type', 'question'], ['id', '123']], '   ');

        await customBanReason.execute(interaction);

        expect(mockApplyBan).not.toHaveBeenCalled();
        expect(interaction.ephemeralReply).toHaveBeenCalled();
    });

    it('should report a failure rather than claiming success', async () => {
        mockApplyBan.mockRejectedValue(new Error('DS unavailable'));

        await customBanReason.execute(mockModalInteraction);

        expect(mockLogger.error).toHaveBeenCalled();
        expect(mockModalInteraction.ephemeralReply).toHaveBeenCalled();
    });
});
