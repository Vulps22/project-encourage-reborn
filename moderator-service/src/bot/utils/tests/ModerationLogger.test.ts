import { ModerationLogger } from '../ModerationLogger';
import { Logger } from '../Logger';
import { newQuestionView } from '../../../views/moderation/newQuestionView';
import { serverView } from '../../../views/moderation/serverView';
import { ReportView } from '../../../views/moderation/reportView';
import { Question, Report, ReportStatus, QuestionType, TargetType } from '@vulps22/project-encourage-types';

jest.mock('../Logger', () => ({
    Logger: {
        debug: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('../../config', () => ({
    Config: {
        REPORT_CHANNEL_ID: 'report-channel-id',
        SERVER_LOG_CHANNEL_ID: 'server-log-channel-id',
    },
}));

jest.mock('../../../views/moderation/newQuestionView', () => ({
    newQuestionView: jest.fn().mockResolvedValue({ components: [] }),
}));

jest.mock('../../../views/moderation/serverView', () => ({
    serverView: jest.fn().mockResolvedValue({ components: [] }),
}));

jest.mock('../../../views/moderation/reportView', () => ({
    ReportView: jest.fn().mockReturnValue({ components: [] }),
}));

const mockQuestion: Question = {
    id: 1,
    type: 'truth' as QuestionType,
    question: 'Test question?',
    user_id: '123456789',
    is_approved: false,
    approved_by: null,
    datetime_approved: null,
    is_banned: false,
    ban_reason: null,
    banned_by: null,
    datetime_banned: null,
    created: new Date('2024-01-01T00:00:00.000Z'),
    server_id: '987654321',
    message_id: 'msg-123',
    is_deleted: false,
    datetime_deleted: null,
};

const mockReport: Report = {
    id: 1,
    type: TargetType.User,
    content: null,
    ban_reason: null,
    sender_id: '99',
    offender_id: '42',
    server_id: '111111111',
    status: ReportStatus.PENDING,
    moderator_id: null,
    message_id: 'msg-456',
    reason: 'Harassment',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    updated_at: new Date('2024-01-01T00:00:00.000Z'),
};

const mockServer = {
    id: BigInt('123456789012345678'),
    name: 'Test Server',
    message_id: 'msg-789',
    can_create: true,
    is_banned: false,
    ban_reason: null,
    banned_by: null,
    datetime_banned: null,
};

function createMockChannel(overrides: Record<string, any> = {}) {
    return {
        isTextBased: jest.fn().mockReturnValue(true),
        send: jest.fn().mockResolvedValue({ id: 'sent-msg-id' }),
        messages: { fetch: jest.fn() },
        ...overrides,
    };
}

function setClientChannel(channel: any) {
    (global as any).client = {
        channels: { cache: { get: jest.fn().mockReturnValue(channel) } },
    };
}

describe('ModerationLogger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logQuestion', () => {
        it('should broadcast to the correct channel and return the sent message', async () => {
            const channel = createMockChannel();
            setClientChannel(channel);

            const result = await ModerationLogger.logQuestion(mockQuestion, 'channel-123');

            expect((global as any).client.channels.cache.get).toHaveBeenCalledWith('channel-123');
            expect(channel.send).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ id: 'sent-msg-id' });
        });

        it('should return null when no channel is found', async () => {
            setClientChannel(undefined);

            const result = await ModerationLogger.logQuestion(mockQuestion, 'channel-123');

            expect(result).toBeNull();
        });

        it('should return null when the channel is not text-based', async () => {
            setClientChannel(createMockChannel({ isTextBased: jest.fn().mockReturnValue(false) }));

            const result = await ModerationLogger.logQuestion(mockQuestion, 'channel-123');

            expect(result).toBeNull();
        });
    });

    describe('updateQuestionLog', () => {
        it('should return null early when question has no message_id', async () => {
            const channel = createMockChannel();
            setClientChannel(channel);
            const questionWithoutMessage = { ...mockQuestion, message_id: null };

            const result = await ModerationLogger.updateQuestionLog(questionWithoutMessage, 'channel-123');

            expect(result).toBeNull();
            expect(channel.messages.fetch).not.toHaveBeenCalled();
        });

        it('should fetch and return the updated message on success', async () => {
            const mockMessage = { id: 'updated-msg-id', edit: jest.fn().mockResolvedValue({ id: 'updated-msg-id' }) };
            const channel = createMockChannel();
            channel.messages.fetch.mockResolvedValue(mockMessage);
            setClientChannel(channel);

            const result = await ModerationLogger.updateQuestionLog(mockQuestion, 'channel-123');

            expect(channel.messages.fetch).toHaveBeenCalledWith('msg-123');
            expect(mockMessage.edit).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ id: 'updated-msg-id' });
        });

        it('should log an error and return null when update fails', async () => {
            const channel = createMockChannel();
            channel.messages.fetch.mockRejectedValue(new Error('Message not found'));
            setClientChannel(channel);

            const result = await ModerationLogger.updateQuestionLog(mockQuestion, 'channel-123');

            expect(Logger.error).toHaveBeenCalledWith('Failed to update question log: Error: Message not found');
            expect(result).toBeNull();
        });
    });

    describe('logReport', () => {
        it('should send and return the sent message', async () => {
            const channel = createMockChannel();
            setClientChannel(channel);

            const result = await ModerationLogger.logReport(mockReport);

            expect((global as any).client.channels.cache.get).toHaveBeenCalledWith('report-channel-id');
            expect(channel.send).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ id: 'sent-msg-id' });
        });

        it('should return null when no channel is found', async () => {
            setClientChannel(undefined);

            const result = await ModerationLogger.logReport(mockReport);

            expect(result).toBeNull();
        });
    });

    describe('updateReportLog', () => {
        it('should return null early when report has no message_id', async () => {
            const channel = createMockChannel();
            setClientChannel(channel);
            const reportWithoutMessage = { ...mockReport, message_id: null };

            const result = await ModerationLogger.updateReportLog(reportWithoutMessage as Report);

            expect(result).toBeNull();
            expect(channel.messages.fetch).not.toHaveBeenCalled();
        });

        it('should fetch and return the updated message on success', async () => {
            const mockMessage = { id: 'updated-report-msg-id', edit: jest.fn().mockResolvedValue({ id: 'updated-report-msg-id' }) };
            const channel = createMockChannel();
            channel.messages.fetch.mockResolvedValue(mockMessage);
            setClientChannel(channel);

            const result = await ModerationLogger.updateReportLog(mockReport);

            expect(channel.messages.fetch).toHaveBeenCalledWith('msg-456');
            expect(mockMessage.edit).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ id: 'updated-report-msg-id' });
        });

        it('should log an error and return null when update fails', async () => {
            const channel = createMockChannel();
            channel.messages.fetch.mockRejectedValue(new Error('Channel not found'));
            setClientChannel(channel);

            const result = await ModerationLogger.updateReportLog(mockReport);

            expect(Logger.error).toHaveBeenCalledWith('Failed to update report log: Error: Channel not found');
            expect(result).toBeNull();
        });
    });

    describe('logServer', () => {
        it('should send and return the sent message', async () => {
            const channel = createMockChannel();
            setClientChannel(channel);

            const result = await ModerationLogger.logServer(mockServer as any);

            expect((global as any).client.channels.cache.get).toHaveBeenCalledWith('server-log-channel-id');
            expect(channel.send).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ id: 'sent-msg-id' });
        });

        it('should return null when no channel is found', async () => {
            setClientChannel(undefined);

            const result = await ModerationLogger.logServer(mockServer as any);

            expect(result).toBeNull();
        });
    });

    describe('updateServerLog', () => {
        it('should return null early when server has no message_id', async () => {
            const channel = createMockChannel();
            setClientChannel(channel);
            const serverWithoutMessage = { ...mockServer, message_id: null };

            const result = await ModerationLogger.updateServerLog(serverWithoutMessage as any);

            expect(result).toBeNull();
            expect(channel.messages.fetch).not.toHaveBeenCalled();
        });

        it('should fetch and return the updated message on success', async () => {
            const mockMessage = { id: 'updated-server-msg-id', edit: jest.fn().mockResolvedValue({ id: 'updated-server-msg-id' }) };
            const channel = createMockChannel();
            channel.messages.fetch.mockResolvedValue(mockMessage);
            setClientChannel(channel);

            const result = await ModerationLogger.updateServerLog(mockServer as any);

            expect(channel.messages.fetch).toHaveBeenCalledWith('msg-789');
            expect(mockMessage.edit).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ id: 'updated-server-msg-id' });
        });

        it('should log an error and return null when update fails', async () => {
            const channel = createMockChannel();
            channel.messages.fetch.mockRejectedValue(new Error('Message not found'));
            setClientChannel(channel);

            const result = await ModerationLogger.updateServerLog(mockServer as any);

            expect(Logger.error).toHaveBeenCalledWith('Failed to update server log: Error: Message not found');
            expect(result).toBeNull();
        });
    });
});
