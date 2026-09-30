import { BotButtonInteraction } from '@vulps22/bot-interactions';
import skip from '../../question/skip';
import { challengeService, entitlementService, inventoryService, questionService, votingService } from '../../../../services';
import { noSkipsView } from '../../../../views';

jest.mock('../../../../services', () => ({
    challengeService: { getChallengeByMessageId: jest.fn(), skip: jest.fn() },
    entitlementService: { getPurchasableByName: jest.fn() },
    inventoryService: { consume: jest.fn() },
    questionService: { getQuestionById: jest.fn() },
    votingService: { getVoteCount: jest.fn(), finalizeChallenge: jest.fn() },
}));

jest.mock('../../../../views', () => ({
    challengeEmbed: jest.fn().mockReturnValue({}),
    noSkipsView: jest.fn().mockReturnValue({ flags: 32768, components: [] }),
}));

jest.mock('@vulps22/logger', () => ({
    Logger: { error: jest.fn(), debug: jest.fn() },
}));

const mockChallenge = { id: 1, user_id: 'user-123', question_id: 42, message_id: 'msg-1' };
const mockChallengeVote = { final_result: null };
const mockQuestion = { id: 42, content: 'Test question' };
const mockUpdated = { final_result: 'skipped' };

describe('skip button handler', () => {
    let mockInteraction: jest.Mocked<BotButtonInteraction>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            messageId: 'msg-1',
            user: { id: 'user-123' },
            deferUpdate: jest.fn().mockResolvedValue(undefined),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            ephemeralFollowUp: jest.fn().mockResolvedValue(undefined),
            updateComponentMessage: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<BotButtonInteraction>;

        (challengeService.getChallengeByMessageId as jest.Mock).mockResolvedValue(mockChallenge);
        (votingService.getVoteCount as jest.Mock).mockResolvedValue(mockChallengeVote);
        (inventoryService.consume as jest.Mock).mockResolvedValue({ qty: 0 });
        (entitlementService.getPurchasableByName as jest.Mock).mockResolvedValue(null);
        (challengeService.skip as jest.Mock).mockResolvedValue(undefined);
        (votingService.finalizeChallenge as jest.Mock).mockResolvedValue(mockUpdated);
        (questionService.getQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
    });

    it('should have correct name', () => {
        expect(skip.name).toBe('skip');
        expect(skip.interactionInitiator).toBe(true);
    });

    it('should reply with error when challenge not found', async () => {
        (challengeService.getChallengeByMessageId as jest.Mock).mockResolvedValue(null);

        await skip.execute(mockInteraction);

        expect(mockInteraction.ephemeralFollowUp).toHaveBeenCalledWith(expect.objectContaining({ flags: expect.any(Number) }));
    });

    it('should reply with error when user is not the challenge owner', async () => {
        (challengeService.getChallengeByMessageId as jest.Mock).mockResolvedValue({ ...mockChallenge, user_id: 'someone-else' });

        await skip.execute(mockInteraction);

        expect(mockInteraction.ephemeralFollowUp).toHaveBeenCalledWith(expect.objectContaining({ flags: expect.any(Number) }));
    });

    it('should reply with error when challenge is already locked', async () => {
        (votingService.getVoteCount as jest.Mock).mockResolvedValue({ final_result: 'done' });

        await skip.execute(mockInteraction);

        expect(mockInteraction.ephemeralFollowUp).toHaveBeenCalledWith(expect.objectContaining({ flags: expect.any(Number) }));
    });

    it('should reply with no skips message when consume returns false', async () => {
        (inventoryService.consume as jest.Mock).mockResolvedValue(false);

        await skip.execute(mockInteraction);

        expect(mockInteraction.ephemeralFollowUp).toHaveBeenCalledWith(expect.objectContaining({ flags: expect.any(Number) }));
    });

    it('should offer the skip pack SKU in the no skips message', async () => {
        (inventoryService.consume as jest.Mock).mockResolvedValue(false);
        (entitlementService.getPurchasableByName as jest.Mock).mockResolvedValue({ name: 'skip-pack', sku_id: 'sku-123' });

        await skip.execute(mockInteraction);

        expect(entitlementService.getPurchasableByName).toHaveBeenCalledWith('skip-pack');
        expect(noSkipsView).toHaveBeenCalledWith('sku-123');
        expect(challengeService.skip).not.toHaveBeenCalled();
    });

    it('should still show the no skips message when the skip pack lookup fails', async () => {
        (inventoryService.consume as jest.Mock).mockResolvedValue(false);
        (entitlementService.getPurchasableByName as jest.Mock).mockRejectedValue(new Error('ds down'));

        await skip.execute(mockInteraction);

        expect(noSkipsView).toHaveBeenCalledWith(null);
        expect(mockInteraction.ephemeralFollowUp).toHaveBeenCalled();
    });

    it('should finalize and update embed on happy path', async () => {
        await skip.execute(mockInteraction);

        expect(inventoryService.consume).toHaveBeenCalledWith('user-123', 'skip', 1);
        expect(challengeService.skip).toHaveBeenCalledWith(1);
        expect(votingService.finalizeChallenge).toHaveBeenCalledWith(1, 'skipped');
        expect(mockInteraction.updateComponentMessage).toHaveBeenCalled();
        expect(mockInteraction.ephemeralFollowUp).not.toHaveBeenCalledWith(expect.stringContaining('skipped'));
    });
});
