import express, { Request, Response } from 'express';
import { Logger } from '../utils';

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

    app.post('/webhook/vote', (req: Request, res: Response) => {
        const auth = req.headers['authorization'];

        if (auth !== authToken) {
            Logger.error(`[VoteWebhook] Unauthorized request received`);
            res.status(401).send('Unauthorized');
            return;
        }

        const payload = req.body as TopGGVotePayload;

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
