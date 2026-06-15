import { ModerationLogger } from '../ModerationLogger';
import { Logger } from '../Logger';
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

function mockBroadcastEval(returnValues: any[]) {
    (global as any).client = {
        shard: {
            broadcastEval: jest.fn().mockResolvedValue(returnValues),
        },
    };
}

describe('ModerationLogger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logQuestion', () => {
        it('should broadcast to the correct channel and return the sent message', async () => {
            const mockMessage = { id: 'sent-msg-id' };
            mockBroadcastEval([null, mockMessage]);

            const result = await ModerationLogger.logQuestion(mockQuestion, 'channel-123');

            expect((global as any).client.shard.broadcastEval).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMessage);
        });

        it('should return null when no shard finds the channel', async () => {
            mockBroadcastEval([null, null]);

            const result = await ModerationLogger.logQuestion(mockQuestion, 'channel-123');

            expect(result).toBeNull();
        });
    });

    describe('updateQuestionLog', () => {
        it('should return null early when question has no message_id', async () => {
            mockBroadcastEval([]);
            const questionWithoutMessage = { ...mockQuestion, message_id: null };

            const result = await ModerationLogger.updateQuestionLog(questionWithoutMessage, 'channel-123');

            expect(result).toBeNull();
            expect((global as any).client.shard.broadcastEval).not.toHaveBeenCalled();
        });

        it('should broadcast and return the updated message on success', async () => {
            const mockMessage = { id: 'updated-msg-id' };
            mockBroadcastEval([{ success: true, error: null, message: mockMessage }]);

            const result = await ModerationLogger.updateQuestionLog(mockQuestion, 'channel-123');

            expect((global as any).client.shard.broadcastEval).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMessage);
        });

        it('should log an error and return null when update fails', async () => {
            mockBroadcastEval([{ success: false, error: 'Message not found', message: null }]);

            const result = await ModerationLogger.updateQuestionLog(mockQuestion, 'channel-123');

            expect(Logger.error).toHaveBeenCalledWith('Failed to update question log: Message not found');
            expect(result).toBeNull();
        });
    });

    describe('logReport', () => {
        it('should broadcast and return the sent message', async () => {
            const mockMessage = { id: 'report-msg-id' };
            mockBroadcastEval([mockMessage]);

            const result = await ModerationLogger.logReport(mockReport);

            expect((global as any).client.shard.broadcastEval).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMessage);
        });

        it('should return null when no shard finds the channel', async () => {
            mockBroadcastEval([null, null]);

            const result = await ModerationLogger.logReport(mockReport);

            expect(result).toBeNull();
        });
    });

    describe('updateReportLog', () => {
        it('should return null early when report has no message_id', async () => {
            mockBroadcastEval([]);
            const reportWithoutMessage = { ...mockReport, message_id: null };

            const result = await ModerationLogger.updateReportLog(reportWithoutMessage as Report);

            expect(result).toBeNull();
            expect((global as any).client.shard.broadcastEval).not.toHaveBeenCalled();
        });

        it('should broadcast and return the updated message on success', async () => {
            const mockMessage = { id: 'updated-report-msg-id' };
            mockBroadcastEval([{ success: true, error: null, message: mockMessage }]);

            const result = await ModerationLogger.updateReportLog(mockReport);

            expect((global as any).client.shard.broadcastEval).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMessage);
        });

        it('should log an error and return null when update fails', async () => {
            mockBroadcastEval([{ success: false, error: 'Channel not found', message: null }]);

            const result = await ModerationLogger.updateReportLog(mockReport);

            expect(Logger.error).toHaveBeenCalledWith('Failed to update report log: Channel not found');
            expect(result).toBeNull();
        });
    });

    describe('logServer', () => {
        it('should broadcast and return the sent message', async () => {
            const mockMessage = { id: 'server-msg-id' };
            mockBroadcastEval([mockMessage]);

            const result = await ModerationLogger.logServer(mockServer as any);

            expect((global as any).client.shard.broadcastEval).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMessage);
        });

        it('should return null when no shard finds the channel', async () => {
            mockBroadcastEval([null, null]);

            const result = await ModerationLogger.logServer(mockServer as any);

            expect(result).toBeNull();
        });
    });

    describe('updateServerLog', () => {
        it('should return null early when server has no message_id', async () => {
            mockBroadcastEval([]);
            const serverWithoutMessage = { ...mockServer, message_id: null };

            const result = await ModerationLogger.updateServerLog(serverWithoutMessage as any);

            expect(result).toBeNull();
            expect((global as any).client.shard.broadcastEval).not.toHaveBeenCalled();
        });

        it('should broadcast and return the updated message on success', async () => {
            const mockMessage = { id: 'updated-server-msg-id' };
            mockBroadcastEval([{ success: true, error: null, message: mockMessage }]);

            const result = await ModerationLogger.updateServerLog(mockServer as any);

            expect((global as any).client.shard.broadcastEval).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMessage);
        });

        it('should log an error and return null when update fails', async () => {
            mockBroadcastEval([{ success: false, error: 'Message not found', message: null }]);

            const result = await ModerationLogger.updateServerLog(mockServer as any);

            expect(Logger.error).toHaveBeenCalledWith('Failed to update server log: Message not found');
            expect(result).toBeNull();
        });
    });
});
