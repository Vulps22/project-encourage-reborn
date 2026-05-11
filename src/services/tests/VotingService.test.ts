import { VotingService } from '../VotingService';
import { dsClient, DSError } from '../../client';
import { ChallengeVote } from '@vulps22/project-encourage-types';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

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

    beforeEach(() => {
        service = new VotingService();
        jest.clearAllMocks();
    });

    describe('addChallenge', () => {
        it('should post to /vote/:id and return the ChallengeVote', async () => {
            const cv = makeChallengeVote();
            (dsClient.post as jest.Mock).mockResolvedValue(cv);

            const result = await service.addChallenge(1);

            expect(dsClient.post).toHaveBeenCalledWith('/vote/:id', { id: 1 });
            expect(result).toEqual(cv);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(500, 'Failed'));

            await expect(service.addChallenge(1)).rejects.toThrow('Failed');
        });
    });

    describe('vote', () => {
        it('should post to /vote/:id/done for done votes', async () => {
            const cv = makeChallengeVote({ done_count: 1 });
            (dsClient.post as jest.Mock).mockResolvedValue(cv);

            const result = await service.vote(1, '222', 'done');

            expect(dsClient.post).toHaveBeenCalledWith('/vote/:id/done', { id: 1 }, { user_id: '222' });
            expect(result).toEqual(cv);
        });

        it('should post to /vote/:id/fail for failed votes', async () => {
            const cv = makeChallengeVote({ failed_count: 1 });
            (dsClient.post as jest.Mock).mockResolvedValue(cv);

            const result = await service.vote(1, '222', 'failed');

            expect(dsClient.post).toHaveBeenCalledWith('/vote/:id/fail', { id: 1 }, { user_id: '222' });
            expect(result).toEqual(cv);
        });

        it('should throw DSError(409) when user has already voted', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(409, 'Already voted'));

            await expect(service.vote(1, '222', 'done')).rejects.toThrow('Already voted');
        });
    });

    describe('getVoteCount', () => {
        it('should get from /vote/:id and return the ChallengeVote', async () => {
            const cv = makeChallengeVote({ done_count: 2, failed_count: 1 });
            (dsClient.get as jest.Mock).mockResolvedValue(cv);

            const result = await service.getVoteCount(1);

            expect(dsClient.get).toHaveBeenCalledWith('/vote/:id', { id: 1 });
            expect(result).toEqual(cv);
        });

        it('should throw NO_TRACKING on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            await expect(service.getVoteCount(1)).rejects.toThrow('NO_TRACKING');
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Internal error'));

            await expect(service.getVoteCount(1)).rejects.toThrow('Internal error');
        });
    });

    describe('finalizeChallenge', () => {
        it('should patch /vote/:id/finalise with the result', async () => {
            const cv = makeChallengeVote({ final_result: 'done', finalised_datetime: new Date() });
            (dsClient.patch as jest.Mock).mockResolvedValue(cv);

            const result = await service.finalizeChallenge(1, 'done');

            expect(dsClient.patch).toHaveBeenCalledWith('/vote/:id/finalise', { id: 1 }, { result: 'done' });
            expect(result).toEqual(cv);
        });

        it('should finalize as failed', async () => {
            const cv = makeChallengeVote({ final_result: 'failed', finalised_datetime: new Date() });
            (dsClient.patch as jest.Mock).mockResolvedValue(cv);

            const result = await service.finalizeChallenge(1, 'failed');

            expect(dsClient.patch).toHaveBeenCalledWith('/vote/:id/finalise', { id: 1 }, { result: 'failed' });
            expect(result).toEqual(cv);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.patch as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            await expect(service.finalizeChallenge(1, 'done')).rejects.toThrow('Not found');
        });
    });
});
