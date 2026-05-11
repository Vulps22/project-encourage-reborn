import { ChallengeService } from '../ChallengeService';
import { dsClient, DSError } from '../../client';
import { Challenge, QuestionType} from '@vulps22/project-encourage-types';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
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

    beforeEach(() => {
        service = new ChallengeService();
        jest.clearAllMocks();
    });

    describe('createChallenge', () => {
        it('should post and return the created challenge', async () => {
            const challenge = makeChallenge();
            (dsClient.post as jest.Mock).mockResolvedValue(challenge);

            const result = await service.createChallenge('111', 1, '222', '333', 'testuser', QuestionType.Truth);

            expect(dsClient.post).toHaveBeenCalledWith('/challenge', undefined, {
                user_id: '111',
                question_id: 1,
                server_id: '222',
                channel_id: '333',
                username: 'testuser',
                type: QuestionType.Truth,
            });
            expect(result).toEqual(challenge);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(500, 'Failed to create challenge'));

            await expect(service.createChallenge('111', 1, '222', '333', 'testuser', QuestionType.Truth))
                .rejects.toThrow('Failed to create challenge');
        });
    });

    describe('setMessageId', () => {
        it('should patch the message_id on the challenge', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(undefined);

            await service.setMessageId(1, '999');

            expect(dsClient.patch).toHaveBeenCalledWith(
                '/challenge/:id/message',
                { id: 1 },
                { message_id: '999' }
            );
        });
    });

    describe('getChallengeByMessageId', () => {
        it('should return the challenge when found', async () => {
            const challenge = makeChallenge({ message_id: '999' });
            (dsClient.get as jest.Mock).mockResolvedValue(challenge);

            const result = await service.getChallengeByMessageId('999');

            expect(dsClient.get).toHaveBeenCalledWith('/challenge/message/:messageId', { messageId: '999' });
            expect(result).toEqual(challenge);
        });

        it('should return null on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'Challenge not found'));

            const result = await service.getChallengeByMessageId('999');

            expect(result).toBeNull();
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Internal server error'));

            await expect(service.getChallengeByMessageId('999')).rejects.toThrow('Internal server error');
        });
    });

    describe('skip', () => {
        it('should patch skip and return the updated challenge', async () => {
            const updated = makeChallenge({ skipped: true });
            (dsClient.patch as jest.Mock).mockResolvedValue(updated);

            const result = await service.skip(1);

            expect(dsClient.patch).toHaveBeenCalledWith('/challenge/:id/skip', { id: 1 });
            expect(result).toEqual(updated);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.patch as jest.Mock).mockRejectedValue(new DSError(404, 'Challenge not found'));

            await expect(service.skip(1)).rejects.toThrow('Challenge not found');
        });
    });
});
