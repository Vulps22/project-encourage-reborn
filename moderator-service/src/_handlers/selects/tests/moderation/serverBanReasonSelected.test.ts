import serverBanReasonSelected from '../../moderation/serverBanReasonSelected';
import { BotSelectMenuInteraction } from '@vulps22/bot-interactions';
import { moderationService } from '../../../../services';
import { Logger, ModerationLogger } from '../../../../bot/utils';
import { ServerProfileBuilder } from '../../../../bot/builders/ServerProfileBuilder';

jest.mock('../../../../services', () => ({
    moderationService: {
        banServer: jest.fn(),
        findActioningReports: jest.fn().mockResolvedValue([]),
        actionedReport: jest.fn().mockResolvedValue(undefined),
    },
    reportService: {
        notifyReporter: jest.fn().mockResolvedValue(undefined),
    }
}));

jest.mock('../../../../bot/utils', () => ({
    Logger: {
        error: jest.fn()
    },
    ModerationLogger: {
        updateServerLog: jest.fn(),
    }
}));

jest.mock('../../../../bot/builders/ServerProfileBuilder', () => ({
    ServerProfileBuilder: jest.fn().mockImplementation(() => ({
        getServerProfile: jest.fn()
    }))
}));

const mockModerationService = moderationService as jest.Mocked<typeof moderationService>;
const mockLogger = Logger as jest.Mocked<typeof Logger>;
const mockModerationLogger = ModerationLogger as jest.Mocked<typeof ModerationLogger>;
const MockServerProfileBuilder = ServerProfileBuilder as jest.MockedClass<typeof ServerProfileBuilder>;

describe('serverBanReasonSelected select menu handler', () => {
    let mockSelectInteraction: jest.Mocked<BotSelectMenuInteraction>;
    let mockGetServerProfile: jest.Mock;
    let originalConsoleError: any;

    beforeAll(() => {
        originalConsoleError = console.error;
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockModerationService.findActioningReports.mockResolvedValue([]);

        mockGetServerProfile = jest.fn();
        MockServerProfileBuilder.mockImplementation(() => ({
            getServerProfile: mockGetServerProfile
        }) as any);

        mockSelectInteraction = {
            user: { id: '123456789012345678' },
            message: { id: 'message-456' },
            values: ['Hate Speech'],
            params: new Map([['id', '987654321098765432']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            sendReply: jest.fn().mockResolvedValue(undefined)
        } as any;

        mockSelectInteraction.params.get = jest.fn().mockReturnValue('987654321098765432');
    });

    it('should have correct handler structure', () => {
        expect(serverBanReasonSelected.name).toBe('serverBanReasonSelected');
        expect(typeof serverBanReasonSelected.execute).toBe('function');
    });

    it('should ban server and reply ephemerally on success', async () => {
        const mockProfile = { id: '987654321098765432', name: 'Test Server' };
        mockModerationService.banServer.mockResolvedValue(undefined);
        mockGetServerProfile.mockResolvedValue(mockProfile);
        mockModerationLogger.updateServerLog.mockResolvedValue({} as any);

        await serverBanReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banServer).toHaveBeenCalledWith('987654321098765432', '123456789012345678', 'Hate Speech');
        expect(mockGetServerProfile).toHaveBeenCalledWith('987654321098765432');
        expect(mockModerationLogger.updateServerLog).toHaveBeenCalledWith(mockProfile);
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('✅ Server banned successfully!');
        expect(mockSelectInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should reply ephemerally with error when server ID is missing', async () => {
        mockSelectInteraction.params.get = jest.fn().mockReturnValue(undefined);

        await serverBanReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banServer).not.toHaveBeenCalled();
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Invalid server ID');
        expect(mockLogger.error).toHaveBeenCalledWith('Server ID not found when executing serverBanReasonSelected');
    });

    it('should reply ephemerally with error when no reason selected', async () => {
        const mockInteractionEmptyValues = { ...mockSelectInteraction, values: [] };

        await serverBanReasonSelected.execute(mockInteractionEmptyValues as any);

        expect(mockModerationService.banServer).not.toHaveBeenCalled();
        expect(mockInteractionEmptyValues.ephemeralReply).toHaveBeenCalledWith('❌ No reason selected');
    });

    it('should reply ephemerally with error when server profile not found after banning', async () => {
        mockModerationService.banServer.mockResolvedValue(undefined);
        mockGetServerProfile.mockResolvedValue(null);

        await serverBanReasonSelected.execute(mockSelectInteraction);

        expect(mockLogger.error).toHaveBeenCalledWith('Server with ID 987654321098765432 not found during banning for message message-456');
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Server not found');
        expect(mockSelectInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should reply ephemerally with error on service failure', async () => {
        const testError = new Error('Database connection failed');
        mockModerationService.banServer.mockRejectedValue(testError);

        await serverBanReasonSelected.execute(mockSelectInteraction);

        expect(console.error).toHaveBeenCalledWith('Error banning server:', testError);
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Failed to ban server. Please try again.');
        expect(mockSelectInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should use first value from values array', async () => {
        const mockInteractionMultiValues = { ...mockSelectInteraction, values: ['First reason', 'Second reason'] };
        mockModerationService.banServer.mockResolvedValue(undefined);
        mockGetServerProfile.mockResolvedValue({ id: '987654321098765432' });
        mockModerationLogger.updateServerLog.mockResolvedValue({} as any);

        await serverBanReasonSelected.execute(mockInteractionMultiValues as any);

        expect(mockModerationService.banServer).toHaveBeenCalledWith('987654321098765432', '123456789012345678', 'First reason');
    });

    it('should pass correct moderator ID from interaction user', async () => {
        mockSelectInteraction.user.id = '999888777666555444';
        mockModerationService.banServer.mockResolvedValue(undefined);
        mockGetServerProfile.mockResolvedValue({ id: '987654321098765432' });
        mockModerationLogger.updateServerLog.mockResolvedValue({} as any);

        await serverBanReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banServer).toHaveBeenCalledWith('987654321098765432', '999888777666555444', 'Hate Speech');
    });

    it('should notify all reporters when multiple ACTIONING reports exist', async () => {
        const mockReports = [
            { id: 20, sender_id: 'reporter-1' },
            { id: 21, sender_id: 'reporter-2' },
        ];
        mockModerationService.banServer.mockResolvedValue(undefined);
        mockGetServerProfile.mockResolvedValue({ id: '987654321098765432' });
        mockModerationLogger.updateServerLog.mockResolvedValue({} as any);
        (mockModerationService as any).findActioningReports.mockResolvedValue(mockReports);

        await serverBanReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.actionedReport).toHaveBeenCalledTimes(2);
        expect(mockModerationService.actionedReport).toHaveBeenCalledWith(20, '123456789012345678');
        expect(mockModerationService.actionedReport).toHaveBeenCalledWith(21, '123456789012345678');
    });
});
