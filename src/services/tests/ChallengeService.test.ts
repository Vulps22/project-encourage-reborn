import { DatabaseService } from '../DatabaseService';
import { ChallengeService } from '../ChallengeService';
import { Challenge } from '../../interface';
import { QuestionType } from '../../types';

jest.mock('../DatabaseService');

const makeChallenge = (overrides: Partial<Challenge> = {}): Challenge => ({
    id: 1,
    message_id: undefined,
    user_id: '111',
    question_id: 1,
    server_id: '222',
    channel_id: '333',
    username: 'testuser',
    image_url: null,
    skipped: false,
    type: QuestionType.Truth,
    datetime_created: new Date(),
    ...overrides,
});

describe('ChallengeService', () => {
    let service: ChallengeService;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        mockDb = new DatabaseService({
            host: 'localhost',
            user: 'test',
            password: 'test',
            database: 'test',
        }) as jest.Mocked<DatabaseService>;

        service = new ChallengeService(mockDb);
        jest.clearAllMocks();
    });

    describe('createChallenge', () => {
        it('should insert and return the created challenge', async () => {
            const challenge = makeChallenge();
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [challenge] });

            const result = await service.createChallenge('111', 1, '222', '333', 'testuser', QuestionType.Truth);

            expect(mockDb.insert).toHaveBeenCalledWith('challenge', 'challenges', {
                user_id: '111',
                question_id: 1,
                server_id: '222',
                channel_id: '333',
                username: 'testuser',
                type: QuestionType.Truth,
            });
            expect(result).toEqual(challenge);
        });

        it('should throw when insert returns no rows', async () => {
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 0, rows: [] });

            await expect(service.createChallenge('111', 1, '222', '333', 'testuser', QuestionType.Truth))
                .rejects.toThrow('Failed to create challenge for user 111');
        });
    });

    describe('setMessageId', () => {
        it('should update the message_id on the challenge', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1, rows: [] });

            await service.setMessageId(1, '999');

            expect(mockDb.update).toHaveBeenCalledWith(
                'challenge', 'challenges',
                { message_id: '999' },
                { id: 1 }
            );
        });
    });

    describe('getChallengeByMessageId', () => {
        it('should return the challenge when found', async () => {
            const challenge = makeChallenge({ message_id: '999' });
            (mockDb.get as jest.Mock).mockResolvedValue(challenge);

            const result = await service.getChallengeByMessageId('999');

            expect(mockDb.get).toHaveBeenCalledWith('challenge', 'challenges', { message_id: '999' });
            expect(result).toEqual(challenge);
        });

        it('should return null when not found', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            const result = await service.getChallengeByMessageId('999');

            expect(result).toBeNull();
        });
    });

    describe('skip', () => {
        it('should set skipped to true and return the updated challenge', async () => {
            const updated = makeChallenge({ skipped: true });
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1, rows: [updated] });

            const result = await service.skip(1);

            expect(mockDb.update).toHaveBeenCalledWith(
                'challenge', 'challenges',
                { skipped: true },
                { id: 1 }
            );
            expect(result).toEqual(updated);
        });

        it('should throw when update returns no rows', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 0, changedRows: 0, rows: [] });

            await expect(service.skip(1)).rejects.toThrow('Failed to skip challenge 1');
        });
    });
});
