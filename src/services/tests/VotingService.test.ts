import { DatabaseService } from '../DatabaseService';
import { VotingService } from '../VotingService';
import { ChallengeVote } from '../../interface';

jest.mock('../DatabaseService');

const makeChallengeVote = (overrides: Partial<ChallengeVote> = {}): ChallengeVote => ({
    challenge_id: 1,
    done_count: 0,
    failed_count: 0,
    final_result: null,
    finalised_datetime: null,
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

    describe('addChallenge', () => {
        it('should insert into vote.challenge_votes and return the record', async () => {
            const cv = makeChallengeVote();
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [cv] });

            const result = await service.addChallenge(1);

            expect(mockDb.insert).toHaveBeenCalledWith('vote', 'challenge_votes', { challenge_id: 1 });
            expect(result).toEqual(cv);
        });

        it('should throw when insert returns no rows', async () => {
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 0, rows: [] });

            await expect(service.addChallenge(1)).rejects.toThrow('Failed to initialise vote tracking for challenge 1');
        });
    });

    describe('hasUserVoted', () => {
        it('should return false when no vote row exists', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            const result = await service.hasUserVoted(1, '222');

            expect(result).toBe(false);
            expect(mockDb.get).toHaveBeenCalledWith('vote', 'user_votes', {
                challenge_id: 1,
                user_id: '222',
            });
        });

        it('should return true when a vote row exists', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue({ challenge_id: 1, user_id: '222', vote_type: 'done' });

            const result = await service.hasUserVoted(1, '222');

            expect(result).toBe(true);
        });
    });

    describe('recordVote', () => {
        it('should insert into vote.user_votes with correct fields', async () => {
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [] });

            await service.recordVote(1, '222', 'done');

            expect(mockDb.insert).toHaveBeenCalledWith('vote', 'user_votes', {
                challenge_id: 1,
                user_id: '222',
                vote_type: 'done',
            });
        });

        it('should insert with failed vote type', async () => {
            (mockDb.insert as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [] });

            await service.recordVote(1, '222', 'failed');

            expect(mockDb.insert).toHaveBeenCalledWith('vote', 'user_votes', {
                challenge_id: 1,
                user_id: '222',
                vote_type: 'failed',
            });
        });
    });

    describe('incrementCount', () => {
        it('should increment done_count by 1 and return the updated ChallengeVote', async () => {
            const cv = makeChallengeVote({ done_count: 2 });
            const updated = makeChallengeVote({ done_count: 3 });
            (mockDb.get as jest.Mock).mockResolvedValue(cv);
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1, rows: [updated] });

            const result = await service.incrementCount(1, 'done');

            expect(mockDb.update).toHaveBeenCalledWith(
                'vote', 'challenge_votes',
                { done_count: 3 },
                { challenge_id: 1 }
            );
            expect(result).toEqual(updated);
        });

        it('should increment failed_count by 1 and return the updated ChallengeVote', async () => {
            const cv = makeChallengeVote({ failed_count: 1 });
            const updated = makeChallengeVote({ failed_count: 2 });
            (mockDb.get as jest.Mock).mockResolvedValue(cv);
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1, rows: [updated] });

            const result = await service.incrementCount(1, 'failed');

            expect(mockDb.update).toHaveBeenCalledWith(
                'vote', 'challenge_votes',
                { failed_count: 2 },
                { challenge_id: 1 }
            );
            expect(result).toEqual(updated);
        });

        it('should throw NO_TRACKING when challenge_votes row is missing', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            await expect(service.incrementCount(1, 'done')).rejects.toThrow('NO_TRACKING');
            expect(mockDb.update).not.toHaveBeenCalled();
        });
    });

    describe('getVoteCount', () => {
        it('should return the ChallengeVote record', async () => {
            const cv = makeChallengeVote({ done_count: 2, failed_count: 1 });
            (mockDb.get as jest.Mock).mockResolvedValue(cv);

            const result = await service.getVoteCount(1);

            expect(result).toEqual(cv);
            expect(mockDb.get).toHaveBeenCalledWith('vote', 'challenge_votes', { challenge_id: 1 });
        });

        it('should throw NO_TRACKING when record is missing', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            await expect(service.getVoteCount(1)).rejects.toThrow('NO_TRACKING');
        });
    });

    describe('finalizeChallenge', () => {
        it('should update final_result and finalised_datetime', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1 });

            await service.finalizeChallenge(1, 'done');

            expect(mockDb.update).toHaveBeenCalledWith(
                'vote', 'challenge_votes',
                expect.objectContaining({ final_result: 'done' }),
                { challenge_id: 1 }
            );
        });

        it('should finalize as failed', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 1, changedRows: 1 });

            await service.finalizeChallenge(1, 'failed');

            expect(mockDb.update).toHaveBeenCalledWith(
                'vote', 'challenge_votes',
                expect.objectContaining({ final_result: 'failed' }),
                { challenge_id: 1 }
            );
        });
    });
});
