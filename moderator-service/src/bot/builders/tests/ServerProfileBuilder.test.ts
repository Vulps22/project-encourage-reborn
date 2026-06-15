import { ServerProfileBuilder } from '../ServerProfileBuilder';
import { questionService, serverService } from '../../../services';
import { Logger } from '../../utils';

jest.mock('../../../services', () => ({
    serverService: {
        getServerSettings: jest.fn(),
        getServerUserCount: jest.fn(),
        getServerBannedUserCount: jest.fn(),
    },
    questionService: {
        getServerQuestionCount: jest.fn(),
        getServerApprovedQuestionCount: jest.fn(),
        getServerBannedQuestionCount: jest.fn(),
    }
}));

jest.mock('../../utils', () => ({
    Logger: {
        debug: jest.fn()
    }
}));

const mockServerService = serverService as jest.Mocked<typeof serverService>;
const mockQuestionService = questionService as jest.Mocked<typeof questionService>;

describe('ServerProfileBuilder', () => {
    let builder: ServerProfileBuilder;

    const mockServer = {
        id: '987654321098765432',
        name: 'Test Server',
        user_id: '123456789012345678',
        can_create: true,
        is_banned: false,
        ban_reason: null,
        message_id: 'msg-001'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        builder = new ServerProfileBuilder();
    });

    it('should return null when server not found', async () => {
        mockServerService.getServerSettings.mockResolvedValue(null);

        const result = await builder.getServerProfile('987654321098765432');

        expect(result).toBeNull();
        expect(Logger.debug).toHaveBeenCalledWith('Fetching server profile for 987654321098765432');
    });

    it('should return complete server profile when server exists', async () => {
        mockServerService.getServerSettings.mockResolvedValue(mockServer as any);
        mockServerService.getServerUserCount.mockResolvedValue(10);
        mockServerService.getServerBannedUserCount.mockResolvedValue(2);
        mockQuestionService.getServerQuestionCount.mockResolvedValue(50);
        mockQuestionService.getServerApprovedQuestionCount.mockResolvedValue(45);
        mockQuestionService.getServerBannedQuestionCount.mockResolvedValue(5);

        const result = await builder.getServerProfile('987654321098765432');

        expect(result).toEqual({
            id: '987654321098765432',
            name: 'Test Server',
            user_id: '123456789012345678',
            can_create: true,
            is_banned: false,
            ban_reason: null,
            message_id: 'msg-001',
            userCount: 10,
            bannedUserCount: 2,
            questionCount: 50,
            approvedQuestionCount: 45,
            bannedQuestionCount: 5
        });
    });

    it('should fetch all counts in parallel', async () => {
        mockServerService.getServerSettings.mockResolvedValue(mockServer as any);
        mockServerService.getServerUserCount.mockResolvedValue(0);
        mockServerService.getServerBannedUserCount.mockResolvedValue(0);
        mockQuestionService.getServerQuestionCount.mockResolvedValue(0);
        mockQuestionService.getServerApprovedQuestionCount.mockResolvedValue(0);
        mockQuestionService.getServerBannedQuestionCount.mockResolvedValue(0);

        await builder.getServerProfile('987654321098765432');

        expect(mockServerService.getServerUserCount).toHaveBeenCalledWith('987654321098765432');
        expect(mockServerService.getServerBannedUserCount).toHaveBeenCalledWith('987654321098765432');
        expect(mockQuestionService.getServerQuestionCount).toHaveBeenCalledWith('987654321098765432');
        expect(mockQuestionService.getServerApprovedQuestionCount).toHaveBeenCalledWith('987654321098765432');
        expect(mockQuestionService.getServerBannedQuestionCount).toHaveBeenCalledWith('987654321098765432');
    });

    it('should reflect banned server state in profile', async () => {
        const bannedServer = { ...mockServer, is_banned: true, ban_reason: 'Hate Speech' };
        mockServerService.getServerSettings.mockResolvedValue(bannedServer as any);
        mockServerService.getServerUserCount.mockResolvedValue(0);
        mockServerService.getServerBannedUserCount.mockResolvedValue(0);
        mockQuestionService.getServerQuestionCount.mockResolvedValue(0);
        mockQuestionService.getServerApprovedQuestionCount.mockResolvedValue(0);
        mockQuestionService.getServerBannedQuestionCount.mockResolvedValue(0);

        const result = await builder.getServerProfile('987654321098765432');

        expect(result?.is_banned).toBe(true);
        expect(result?.ban_reason).toBe('Hate Speech');
    });
});
