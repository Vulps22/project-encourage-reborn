import request from 'supertest';
import { createVoteWebhookApp } from '../VoteWebhook';
import { Logger } from '../../utils';

jest.mock('../../utils', () => ({
    Logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
}));

const AUTH_TOKEN = 'test-token';

describe('VoteWebhook', () => {
    const app = createVoteWebhookApp(AUTH_TOKEN);

    beforeEach(() => {
        jest.clearAllMocks();
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

        it('should return 200 and log an upvote', async () => {
            const payload = { bot: '999', user: '123', type: 'upvote', isWeekend: false };

            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', AUTH_TOKEN)
                .send(payload);

            expect(res.status).toBe(200);
            expect(Logger.log).toHaveBeenCalledWith(
                '[VoteWebhook] Vote received — user: 123, type: upvote, isWeekend: false'
            );
        });

        it('should return 200 and log a test vote', async () => {
            const payload = { bot: '999', user: '456', type: 'test', isWeekend: true };

            const res = await request(app)
                .post('/webhook/vote')
                .set('Authorization', AUTH_TOKEN)
                .send(payload);

            expect(res.status).toBe(200);
            expect(Logger.log).toHaveBeenCalledWith(
                '[VoteWebhook] Vote received — user: 456, type: test, isWeekend: true'
            );
        });
    });
});
