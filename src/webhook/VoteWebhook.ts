import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { Logger } from '../utils';
import { inventoryService, userService } from '../services';
import { Storable } from '../types';

interface TopGGUser {
    id: string;
    platform_id: string;
    name: string;
    avatar_url: string;
}

interface TopGGProject {
    id: string;
    type: string;
    platform: string;
    platform_id: string;
}

interface TopGGVotePayload {
    type: 'vote.create' | 'webhook.test';
    data: {
        user: TopGGUser;
        project: TopGGProject;
        id?: string;
        weight?: number;
        created_at?: string;
        expires_at?: string;
    };
}

function verifySignature(secret: string, rawBody: Buffer, signatureHeader: string): boolean {
    // Header format: "t=<timestamp>,v1=<hmac>"
    const parts = Object.fromEntries(
        signatureHeader.split(',').map(part => part.split('=') as [string, string])
    );
    const timestamp = parts['t'];
    const theirSignature = parts['v1'];

    if (!timestamp || !theirSignature) return false;

    const message = `${timestamp}.${rawBody.toString('utf8')}`;
    const ourSignature = crypto.createHmac('sha256', secret).update(message).digest('hex');

    const ours = Buffer.from(ourSignature);
    const theirs = Buffer.from(theirSignature);

    if (ours.length !== theirs.length) return false;

    return crypto.timingSafeEqual(ours, theirs);
}

export function createVoteWebhookApp(webhookSecret: string): express.Application {
    const app = express();

    app.use(express.raw({ type: 'application/json' }));

    app.post('/webhook/vote', async (req: Request, res: Response): Promise<void> => {
        const signatureHeader = req.headers['x-topgg-signature'];

        if (!signatureHeader || typeof signatureHeader !== 'string') {
            Logger.error(`[VoteWebhook] Missing signature header`);
            res.status(401).send('Unauthorized');
            return;
        }

        if (!verifySignature(webhookSecret, req.body as Buffer, signatureHeader)) {
            Logger.error(`[VoteWebhook] Invalid signature`);
            res.status(401).send('Unauthorized');
            return;
        }

        let payload: TopGGVotePayload;
        try {
            payload = JSON.parse((req.body as Buffer).toString('utf8')) as TopGGVotePayload;
        } catch {
            Logger.error(`[VoteWebhook] Failed to parse request body`);
            res.status(400).send('Bad Request');
            return;
        }

        if (payload.type === 'webhook.test') {
            Logger.log(`[VoteWebhook] Test webhook received, ignoring.`);
            res.status(200).send('OK');
            return;
        }

        if (payload.type !== 'vote.create') {
            Logger.error(`[VoteWebhook] Unknown event type: ${payload.type}`);
            res.status(400).send('Bad Request');
            return;
        }

        const discordUserId = payload.data.user.platform_id;

        const user = await userService.getUser(discordUserId);
        if (!user) {
            Logger.log(`[VoteWebhook] Vote received from unregistered user ${discordUserId}, skipping inventory update.`);
            res.status(200).send('OK');
            return;
        }

        const skips = await inventoryService.get(discordUserId, Storable.Skip);
        if (skips && skips.qty >= 10) {
            Logger.log(`[VoteWebhook] User ${discordUserId} already has the maximum number of skips.`);
            res.status(200).send('OK');
            return;
        }

        void inventoryService.add(discordUserId, Storable.Skip, 1);

        Logger.log(`[VoteWebhook] Vote received — user: ${discordUserId}, weight: ${payload.data.weight ?? 1}`);

        res.status(200).send('OK');
    });

    return app;
}

export function startVoteWebhook(port: number, webhookSecret: string): void {
    const app = createVoteWebhookApp(webhookSecret);

    app.listen(port, () => {
        Logger.log(`[VoteWebhook] Listening on port ${port}`);
    });
}
