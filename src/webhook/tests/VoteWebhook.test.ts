import crypto from 'crypto';
import request from 'supertest';
import { createVoteWebhookApp } from '../VoteWebhook';
import { Logger } from '../../utils';
import { inventoryService, userService } from '../../services';
import { Storable } from '../../types';

jest.mock('../../utils', () => ({
    Logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('../../services', () => ({
    userService: {
        getUser: jest.fn(),
    },
    inventoryService: {
        get: jest.fn(),
        add: jest.fn(),
    },
}));

const WEBHOOK_SECRET = 'whs_test-secret';
const DISCORD_USER_ID = '914368203482890240';

function makeSignature(secret: string, body: string, timestamp = '1700000000'): string {
    const message = `${timestamp}.${body}`;
    const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');
    return `t=${timestamp},v1=${signature}`;
}

const TEST_PAYLOAD = {
    type: 'webhook.test',
    data: {
        user: { id: 'topgg-internal-id', platform_id: DISCORD_USER_ID, name: 'testuser', avatar_url: '' },
        project: { id: 'proj-id', type: 'bot', platform: 'discord', platform_id: '1079207025315164331' },
    },
};

const VOTE_PAYLOAD = {
    type: 'vote.create',
    data: {
        id: 'vote-id',
        weight: 1,
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-01-13T00:00:00Z',
        user: { id: 'topgg-internal-id', platform_id: DISCORD_USER_ID, name: 'testuser', avatar_url: '' },
        project: { id: 'proj-id', type: 'bot', platform: 'discord', platform_id: '1079207025315164331' },
    },
};

describe('VoteWebhook', () => {
    const app = createVoteWebhookApp(WEBHOOK_SECRET);

    beforeEach(() => {
        jest.clearAllMocks();
        (userService.getUser as jest.Mock).mockResolvedValue({ id: DISCORD_USER_ID });
    });

    describe('POST /webhook/vote', () => {
        it('should return 401 when signature header is missing', async () => {
            const body = JSON.stringify(VOTE_PAYLOAD);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Content-Type', 'application/json')
                .send(body);

            expect(res.status).toBe(401);
            expect(Logger.error).toHaveBeenCalledWith('[VoteWebhook] Missing signature header');
        });

        it('should return 401 when signature is invalid', async () => {
            const body = JSON.stringify(VOTE_PAYLOAD);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Content-Type', 'application/json')
                .set('x-topgg-signature', 't=1700000000,v1=invalidsignature00000000000000000000000000000000000000000000000000')
                .send(body);

            expect(res.status).toBe(401);
            expect(Logger.error).toHaveBeenCalledWith('[VoteWebhook] Invalid signature');
        });

        it('should return 200 and ignore webhook.test events', async () => {
            const body = JSON.stringify(TEST_PAYLOAD);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Content-Type', 'application/json')
                .set('x-topgg-signature', makeSignature(WEBHOOK_SECRET, body))
                .send(body);

            expect(res.status).toBe(200);
            expect(inventoryService.add).not.toHaveBeenCalled();
            expect(Logger.log).toHaveBeenCalledWith('[VoteWebhook] Test webhook received, ignoring.');
        });

        it('should return 200 and skip the add when user is not registered', async () => {
            (userService.getUser as jest.Mock).mockResolvedValue(null);
            const body = JSON.stringify(VOTE_PAYLOAD);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Content-Type', 'application/json')
                .set('x-topgg-signature', makeSignature(WEBHOOK_SECRET, body))
                .send(body);

            expect(res.status).toBe(200);
            expect(inventoryService.add).not.toHaveBeenCalled();
        });

        it('should return 200 and add a skip for a vote.create event', async () => {
            (inventoryService.get as jest.Mock).mockResolvedValue(null);
            (inventoryService.add as jest.Mock).mockResolvedValue(undefined);
            const body = JSON.stringify(VOTE_PAYLOAD);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Content-Type', 'application/json')
                .set('x-topgg-signature', makeSignature(WEBHOOK_SECRET, body))
                .send(body);

            expect(res.status).toBe(200);
            expect(inventoryService.add).toHaveBeenCalledWith(DISCORD_USER_ID, Storable.Skip, 1);
        });

        it('should return 200 and skip the add when user is at the skip cap', async () => {
            (inventoryService.get as jest.Mock).mockResolvedValue({ qty: 11 });
            const body = JSON.stringify(VOTE_PAYLOAD);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Content-Type', 'application/json')
                .set('x-topgg-signature', makeSignature(WEBHOOK_SECRET, body))
                .send(body);

            expect(res.status).toBe(200);
            expect(inventoryService.add).not.toHaveBeenCalled();
        });
    });
});
