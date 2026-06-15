import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { ChallengeService } from '../ChallengeService';
import { Challenge, QuestionType } from '@vulps22/project-encourage-types';

jest.mock('../../bot/services/DatabaseClient');
jest.mock('../../bot/utils', () => ({
  Logger: {
    debug: jest.fn(),
  }
}));

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
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      createChallenge: jest.fn(),
      setChallengeMessageId: jest.fn(),
      getChallengeByMessageId: jest.fn(),
      skipChallenge: jest.fn(),
    } as any;

    service = new ChallengeService(mockDb);
  });

  describe('createChallenge', () => {
    it('should call createChallenge on DS and return the challenge', async () => {
      const challenge = makeChallenge();
      mockDb.createChallenge.mockResolvedValue(challenge);

      const result = await service.createChallenge('111', 1, '222', '333', 'testuser', QuestionType.Truth);

      expect(mockDb.createChallenge).toHaveBeenCalledWith('111', 1, '222', '333', 'testuser', QuestionType.Truth);
      expect(result).toEqual(challenge);
    });

    it('should propagate DS errors', async () => {
      mockDb.createChallenge.mockRejectedValue(new Error('DS error'));

      await expect(service.createChallenge('111', 1, '222', '333', 'testuser', QuestionType.Truth))
        .rejects.toThrow('DS error');
    });
  });

  describe('setMessageId', () => {
    it('should call setChallengeMessageId on DS', async () => {
      mockDb.setChallengeMessageId.mockResolvedValue(undefined);

      await service.setMessageId(1, '999');

      expect(mockDb.setChallengeMessageId).toHaveBeenCalledWith(1, '999');
    });
  });

  describe('getChallengeByMessageId', () => {
    it('should return the challenge when found', async () => {
      const challenge = makeChallenge({ message_id: '999' });
      mockDb.getChallengeByMessageId.mockResolvedValue(challenge);

      const result = await service.getChallengeByMessageId('999');

      expect(mockDb.getChallengeByMessageId).toHaveBeenCalledWith('999');
      expect(result).toEqual(challenge);
    });

    it('should return null when not found', async () => {
      mockDb.getChallengeByMessageId.mockResolvedValue(null);

      const result = await service.getChallengeByMessageId('999');

      expect(result).toBeNull();
    });
  });

  describe('skip', () => {
    it('should call skipChallenge on DS and return the updated challenge', async () => {
      const updated = makeChallenge({ skipped: true });
      mockDb.skipChallenge.mockResolvedValue(updated);

      const result = await service.skip(1);

      expect(mockDb.skipChallenge).toHaveBeenCalledWith(1);
      expect(result).toEqual(updated);
    });

    it('should throw when skipChallenge returns null', async () => {
      mockDb.skipChallenge.mockResolvedValue(null);

      await expect(service.skip(1)).rejects.toThrow('Failed to skip challenge 1');
    });
  });
});
