import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { VotingService } from '../VotingService';
import { ChallengeVote } from '@vulps22/project-encourage-types';

jest.mock('../../bot/services/DatabaseClient');

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
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      initVote: jest.fn(),
      hasUserVoted: jest.fn(),
      recordVoteDone: jest.fn(),
      recordVoteFail: jest.fn(),
      getVotes: jest.fn(),
      finalizeVote: jest.fn(),
    } as any;

    service = new VotingService(mockDb);
  });

  describe('addChallenge', () => {
    it('should call initVote and return the record', async () => {
      const cv = makeChallengeVote();
      mockDb.initVote.mockResolvedValue(cv);

      const result = await service.addChallenge(1);

      expect(mockDb.initVote).toHaveBeenCalledWith(1);
      expect(result).toEqual(cv);
    });
  });

  describe('hasUserVoted', () => {
    it('should return false when user has not voted', async () => {
      mockDb.hasUserVoted.mockResolvedValue(false);

      const result = await service.hasUserVoted(1, '222');

      expect(result).toBe(false);
      expect(mockDb.hasUserVoted).toHaveBeenCalledWith(1, '222');
    });

    it('should return true when user has voted', async () => {
      mockDb.hasUserVoted.mockResolvedValue(true);

      const result = await service.hasUserVoted(1, '222');

      expect(result).toBe(true);
    });
  });

  describe('recordVote', () => {
    it('should call recordVoteDone for done vote type', async () => {
      const cv = makeChallengeVote({ done_count: 1 });
      mockDb.recordVoteDone.mockResolvedValue(cv);

      await service.recordVote(1, '222', 'done');

      expect(mockDb.recordVoteDone).toHaveBeenCalledWith(1, '222');
      expect(mockDb.recordVoteFail).not.toHaveBeenCalled();
    });

    it('should call recordVoteFail for failed vote type', async () => {
      const cv = makeChallengeVote({ failed_count: 1 });
      mockDb.recordVoteFail.mockResolvedValue(cv);

      await service.recordVote(1, '222', 'failed');

      expect(mockDb.recordVoteFail).toHaveBeenCalledWith(1, '222');
      expect(mockDb.recordVoteDone).not.toHaveBeenCalled();
    });
  });

  describe('incrementCount', () => {
    it('should return current vote counts from DS (already incremented in recordVote)', async () => {
      const cv = makeChallengeVote({ done_count: 3 });
      mockDb.getVotes.mockResolvedValue(cv);

      const result = await service.incrementCount(1, 'done');

      expect(mockDb.getVotes).toHaveBeenCalledWith(1);
      expect(result).toEqual(cv);
    });

    it('should throw NO_TRACKING when record is missing', async () => {
      mockDb.getVotes.mockResolvedValue(null);

      await expect(service.incrementCount(1, 'done')).rejects.toThrow('NO_TRACKING');
    });
  });

  describe('getVoteCount', () => {
    it('should return the ChallengeVote record', async () => {
      const cv = makeChallengeVote({ done_count: 2, failed_count: 1 });
      mockDb.getVotes.mockResolvedValue(cv);

      const result = await service.getVoteCount(1);

      expect(result).toEqual(cv);
      expect(mockDb.getVotes).toHaveBeenCalledWith(1);
    });

    it('should throw NO_TRACKING when record is missing', async () => {
      mockDb.getVotes.mockResolvedValue(null);

      await expect(service.getVoteCount(1)).rejects.toThrow('NO_TRACKING');
    });
  });

  describe('finalizeChallenge', () => {
    it('should finalize as done', async () => {
      const updated = makeChallengeVote({ final_result: 'done', finalised_datetime: new Date() });
      mockDb.finalizeVote.mockResolvedValue(updated);

      const result = await service.finalizeChallenge(1, 'done');

      expect(mockDb.finalizeVote).toHaveBeenCalledWith(1, 'done');
      expect(result).toEqual(updated);
    });

    it('should finalize as failed', async () => {
      const updated = makeChallengeVote({ final_result: 'failed', finalised_datetime: new Date() });
      mockDb.finalizeVote.mockResolvedValue(updated);

      const result = await service.finalizeChallenge(1, 'failed');

      expect(mockDb.finalizeVote).toHaveBeenCalledWith(1, 'failed');
      expect(result).toEqual(updated);
    });

    it('should throw when finalizeVote returns null', async () => {
      mockDb.finalizeVote.mockResolvedValue(null);

      await expect(service.finalizeChallenge(1, 'done')).rejects.toThrow('Failed to finalize challenge 1');
    });
  });
});
