import { VotingService } from '../VotingService';
import { dsClient, DSError } from '../../client';
import { ChallengeVote } from '@vulps22/project-encourage-types';

jest.mock('../../client', () => ({
    dsClient: {
        initVote: jest.fn(),
        recordVoteDone: jest.fn(),
        recordVoteFail: jest.fn(),
        getVotes: jest.fn(),
        finalizeVote: jest.fn(),
    },
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
        it('should call initVote and return the ChallengeVote', async () => {
            const cv = makeChallengeVote();
            (dsClient.initVote as jest.Mock).mockResolvedValue(cv);

            const result = await service.addChallenge(1);

            expect(dsClient.initVote).toHaveBeenCalledWith(1);
            expect(result).toEqual(cv);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.initVote as jest.Mock).mockRejectedValue(new DSError(500, 'Failed'));

            await expect(service.addChallenge(1)).rejects.toThrow('Failed');
        });
    });

    describe('vote', () => {
        it('should call recordVoteDone for done votes', async () => {
            const cv = makeChallengeVote({ done_count: 1 });
            (dsClient.recordVoteDone as jest.Mock).mockResolvedValue(cv);

            const result = await service.vote(1, '222', 'done');

            expect(dsClient.recordVoteDone).toHaveBeenCalledWith(1, '222');
            expect(result).toEqual(cv);
        });

        it('should call recordVoteFail for failed votes', async () => {
            const cv = makeChallengeVote({ failed_count: 1 });
            (dsClient.recordVoteFail as jest.Mock).mockResolvedValue(cv);

            const result = await service.vote(1, '222', 'failed');

            expect(dsClient.recordVoteFail).toHaveBeenCalledWith(1, '222');
            expect(result).toEqual(cv);
        });

        it('should propagate DSError(409) when user has already voted', async () => {
            (dsClient.recordVoteDone as jest.Mock).mockRejectedValue(new DSError(409, 'Already voted'));

            await expect(service.vote(1, '222', 'done')).rejects.toThrow('Already voted');
        });
    });

    describe('getVoteCount', () => {
        it('should call getVotes and return the ChallengeVote', async () => {
            const cv = makeChallengeVote({ done_count: 2, failed_count: 1 });
            (dsClient.getVotes as jest.Mock).mockResolvedValue(cv);

            const result = await service.getVoteCount(1);

            expect(dsClient.getVotes).toHaveBeenCalledWith(1);
            expect(result).toEqual(cv);
        });

        it('should throw NO_TRACKING on 404', async () => {
            (dsClient.getVotes as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            await expect(service.getVoteCount(1)).rejects.toThrow('NO_TRACKING');
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.getVotes as jest.Mock).mockRejectedValue(new DSError(500, 'Internal error'));

            await expect(service.getVoteCount(1)).rejects.toThrow('Internal error');
        });
    });

    describe('finalizeChallenge', () => {
        it('should call finalizeVote with done result', async () => {
            const cv = makeChallengeVote({ final_result: 'done', finalised_datetime: new Date() });
            (dsClient.finalizeVote as jest.Mock).mockResolvedValue(cv);

            const result = await service.finalizeChallenge(1, 'done');

            expect(dsClient.finalizeVote).toHaveBeenCalledWith(1, 'done');
            expect(result).toEqual(cv);
        });

        it('should call finalizeVote with failed result', async () => {
            const cv = makeChallengeVote({ final_result: 'failed', finalised_datetime: new Date() });
            (dsClient.finalizeVote as jest.Mock).mockResolvedValue(cv);

            const result = await service.finalizeChallenge(1, 'failed');

            expect(dsClient.finalizeVote).toHaveBeenCalledWith(1, 'failed');
            expect(result).toEqual(cv);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.finalizeVote as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            await expect(service.finalizeChallenge(1, 'done')).rejects.toThrow('Not found');
        });
    });
});
