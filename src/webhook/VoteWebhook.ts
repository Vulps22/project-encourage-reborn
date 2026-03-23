import express, { Request, Response } from 'express';
import { Logger } from '../utils';
import { inventoryService } from '../services';
import { Storable } from '../types';

interface TopGGVotePayload {
    bot: string;
    user: string;
    type: 'upvote' | 'test';
    isWeekend: boolean;
    query?: string;
}

export function createVoteWebhookApp(authToken: string): express.Application {
    const app = express();

    app.use(express.json());

    app.post('/webhook/vote', async (req: Request, res: Response): Promise<void> =>{
        const auth = req.headers['authorization'];

        if (auth !== authToken) {
            Logger.error(`[VoteWebhook] Unauthorized request received`);
            res.status(401).send('Unauthorized');
            return;
        }

        const payload = req.body as TopGGVotePayload;

        if(!payload.bot || !payload.user || !payload.type) {
            Logger.error(`[VoteWebhook] Invalid payload received: ${JSON.stringify(payload)}`);
            res.status(400).send('Bad Request');
            return;
        }

        if(payload.type !== 'upvote') {
            Logger.log(`[VoteWebhook] Test vote received from user ${payload.user}, ignoring.`);
            res.status(200).send('OK');
            return;
        }

        const skips = await inventoryService.get(payload.user, Storable.Skip);
        if (skips && skips?.qty > 10) {
            Logger.log(`[VoteWebhook] User ${payload.user} has already received the maximum number of skips.`);
            res.status(200).send('OK');
            return;
        }

        void inventoryService.add(payload.user, Storable.Skip, 1);

        Logger.log(`[VoteWebhook] Vote received — user: ${payload.user}, type: ${payload.type}, isWeekend: ${payload.isWeekend}`);

        res.status(200).send('OK');
    });

    return app;
}

export function startVoteWebhook(port: number, authToken: string): void {
    const app = createVoteWebhookApp(authToken);

    app.listen(port, () => {
        Logger.log(`[VoteWebhook] Listening on port ${port}`);
    });
}
