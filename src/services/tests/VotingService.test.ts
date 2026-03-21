import { DatabaseService } from '../DatabaseService';
import { VotingService } from '../VotingService';
import { QuestionType } from '../../types';
import { UserQuestion } from '../../interface';

jest.mock('../DatabaseService');

const makeUserQuestion = (overrides: Partial<UserQuestion> = {}): UserQuestion => ({
    message_id: '111',
    user_id: '222',
    question_id: 1,
    server_id: '333',
    channel_id: null,
    username: 'testuser',
    image_url: null,
    done_count: 0,
    failed_count: 0,
    skipped: false,
    type: QuestionType.Truth,
    final_result: null,
    finalised_datetime: null,
    datetime_created: new Date(),
    ...overrides,
});

describe('VotingService', () => {
    let service: VotingService;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        mockDb = new DatabaseService({
            host: 'localhost',
            user: 'test',
            password: 'test',
            database: 'test',
        }) as jest.Mocked<DatabaseService>;

        service = new VotingService(mockDb);
        jest.clearAllMocks();
    });

    describe('createVoteTracking', () => {
        it('should insert with correct fields and return the created row', async () => {
            const row = makeUserQuestion();
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [row] });

            const result = await service.createVoteTracking(
                '111', '222', 1, '333', '444', 'testuser', QuestionType.Truth
            );

            expect(mockDb.insert).toHaveBeenCalledWith('user', 'user_questions', expect.objectContaining({
                message_id: '111',
                user_id: '222',
                question_id: 1,
                server_id: '333',
                channel_id: '444',
                username: 'testuser',
                type: QuestionType.Truth,
            }));
            expect(result).toEqual(row);
        });

        it('should convert null channelId correctly', async () => {
            const row = makeUserQuestion();
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [row] });

            await service.createVoteTracking('111', '222', 1, '333', null, 'testuser', QuestionType.Truth);

            expect(mockDb.insert).toHaveBeenCalledWith('user', 'user_questions', expect.objectContaining({
                channel_id: null,
            }));

        });

        it('should throw when insert returns no rows', async () => {
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 0, rows: [] });

            await expect(
                service.createVoteTracking('111', '222', 1, '333', null, 'testuser', QuestionType.Truth)
            ).rejects.toThrow('Failed to create vote tracking for message 111');
        });
    });

    describe('hasUserVoted', () => {
        it('should return false when no vote row exists', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            const result = await service.hasUserVoted('111', '222');

            expect(result).toBe(false);
            expect(mockDb.get).toHaveBeenCalledWith('user', 'user_vote', {
                message_id: '111',
                user_id: '222',
            });
        });

        it('should return true when a vote row exists', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue({ message_id: '111', user_id: '222', vote_type: 'done' });

            const result = await service.hasUserVoted('111', '222');

            expect(result).toBe(true);
        });
    });

    describe('recordVote', () => {
        it('should throw ALREADY_VOTED when user has already voted', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue({ message_id: '111', user_id: '222', vote_type: 'done' });

            await expect(service.recordVote('111', '222', 'done')).rejects.toThrow('ALREADY_VOTED');
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it('should throw NO_TRACKING when no user_questions row exists', async () => {
            // hasUserVoted returns null (no vote), then get user_questions returns null
            (mockDb.get as jest.Mock)
                .mockResolvedValueOnce(null)  // hasUserVoted check
                .mockResolvedValueOnce(null); // user_questions lookup

            await expect(service.recordVote('111', '222', 'done')).rejects.toThrow('NO_TRACKING');
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it('should throw QUESTION_FINALIZED when final_result is set', async () => {
            const finalized = makeUserQuestion({ final_result: 'done' });
            (mockDb.get as jest.Mock)
                .mockResolvedValueOnce(null)       // hasUserVoted
                .mockResolvedValueOnce(finalized); // user_questions

            await expect(service.recordVote('111', '222', 'done')).rejects.toThrow('QUESTION_FINALIZED');
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it('should insert vote and increment done_count for done vote', async () => {
            const uq = makeUserQuestion({ done_count: 1, failed_count: 0 });
            const updated = makeUserQuestion({ done_count: 2, failed_count: 0 });
            (mockDb.get as jest.Mock)
                .mockResolvedValueOnce(null)    // hasUserVoted
                .mockResolvedValueOnce(uq)      // user_questions lookup
                .mockResolvedValueOnce(updated); // re-fetch after update
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [] });
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1 });

            const result = await service.recordVote('111', '222', 'done');

            expect(mockDb.insert).toHaveBeenCalledWith('user', 'user_vote', {
                message_id: '111',
                user_id: '222',
                vote_type: 'done',
            });
            expect(mockDb.update).toHaveBeenCalledWith(
                'user', 'user_questions',
                { done_count: 2 },
                { message_id: '111' }
            );
            expect(result).toEqual(updated);
        });

        it('should insert vote and increment failed_count for failed vote', async () => {
            const uq = makeUserQuestion({ done_count: 0, failed_count: 1 });
            const updated = makeUserQuestion({ done_count: 0, failed_count: 2 });
            (mockDb.get as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(uq)
                .mockResolvedValueOnce(updated);
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [] });
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1 });

            await service.recordVote('111', '222', 'failed');

            expect(mockDb.update).toHaveBeenCalledWith(
                'user', 'user_questions',
                { failed_count: 2 },
                { message_id: '111' }
            );
        });
    });

    describe('getVoteStatus', () => {
        it('should return correct VoteStatus from user_questions data', async () => {
            const uq = makeUserQuestion({ done_count: 2, failed_count: 1, final_result: null });
            (mockDb.get as jest.Mock).mockResolvedValue(uq);

            const status = await service.getVoteStatus('111');

            expect(status).toEqual({
                doneCount: 2,
                failedCount: 1,
                threshold: 3,
                isFinalized: false,
                finalResult: null,
            });
        });

        it('should reflect finalized state when final_result is set', async () => {
            const uq = makeUserQuestion({ done_count: 3, failed_count: 0, final_result: 'done' });
            (mockDb.get as jest.Mock).mockResolvedValue(uq);

            const status = await service.getVoteStatus('111');

            expect(status.isFinalized).toBe(true);
            expect(status.finalResult).toBe('done');
        });

        it('should throw NO_TRACKING when no row exists', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            await expect(service.getVoteStatus('111')).rejects.toThrow('NO_TRACKING');
        });
    });
});
