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

const AUTH_TOKEN = 'test-token';
const VALID_PAYLOAD = { bot: '999', user: '123', type: 'upvote', isWeekend: false };

describe('VoteWebhook', () => {
    const app = createVoteWebhookApp(AUTH_TOKEN);

    beforeEach(() => {
        jest.clearAllMocks();
        (userService.getUser as jest.Mock).mockResolvedValue({ id: '123' });
    });

    describe('POST /webhook/vote', () => {
        it('should return 401 when authorization header is missing', async () => {
            const res = await request(app).post('/webhook/vote').send({});

            expect(res.status).toBe(401);
            expect(Logger.error).toHaveBeenCalledWith('[VoteWebhook] Unauthorized request received');
        });

        it('should return 401 when authorization header is wrong', async () => {
            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', 'wrong-token')
                .send({});

            expect(res.status).toBe(401);
            expect(Logger.error).toHaveBeenCalledWith('[VoteWebhook] Unauthorized request received');
        });

        it('should return 400 when payload is missing required fields', async () => {
            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', AUTH_TOKEN)
                .send({ bot: '999' });

            expect(res.status).toBe(400);
            expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid payload'));
        });

        it('should return 200 and ignore test votes', async () => {
            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', AUTH_TOKEN)
                .send({ ...VALID_PAYLOAD, type: 'test' });

            expect(res.status).toBe(200);
            expect(inventoryService.add).not.toHaveBeenCalled();
            expect(Logger.log).toHaveBeenCalledWith(expect.stringContaining('Test vote received'));
        });

        it('should return 200 and skip the add when user is not registered', async () => {
            (userService.getUser as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', AUTH_TOKEN)
                .send(VALID_PAYLOAD);

            expect(res.status).toBe(200);
            expect(inventoryService.add).not.toHaveBeenCalled();
        });

        it('should return 200 and add a skip for an upvote', async () => {
            (inventoryService.get as jest.Mock).mockResolvedValue(null);
            (inventoryService.add as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', AUTH_TOKEN)
                .send(VALID_PAYLOAD);

            expect(res.status).toBe(200);
            expect(inventoryService.add).toHaveBeenCalledWith('123', Storable.Skip, 1);
        });

        it('should return 200 and skip the add when user is at the skip cap', async () => {
            (inventoryService.get as jest.Mock).mockResolvedValue({ qty: 11 });

            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', AUTH_TOKEN)
                .send(VALID_PAYLOAD);

            expect(res.status).toBe(200);
            expect(inventoryService.add).not.toHaveBeenCalled();
        });
    });
});
