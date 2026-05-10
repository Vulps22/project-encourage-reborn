import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ApiRoute, rawBody } from '@vulps22/dynamic-endpoint-router';
import { Logger } from '@vulps22/logger';
import { inventoryService, userService } from '../../../services';
import { Storable } from '@vulps22/project-encourage-types';

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

function verifyTopgg(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers['x-topgg-signature'];

    if (!header || typeof header !== 'string') {
        Logger.error('[VoteWebhook] Missing signature header');
        res.status(401).send('Unauthorized');
        return;
    }

    const secret = process.env.TOPGG_WEBHOOK_AUTH;
    if (!secret) {
        res.status(503).send('Service Unavailable');
        return;
    }

    const parts = Object.fromEntries(
        header.split(',').map(part => {
            const idx = part.indexOf('=');
            return [part.slice(0, idx), part.slice(idx + 1)] as [string, string];
        })
    );
    const timestamp = parts['t'];
    const theirSignature = parts['v1'];

    if (!timestamp || !theirSignature) {
        Logger.error('[VoteWebhook] Invalid signature header format');
        res.status(401).send('Unauthorized');
        return;
    }

    const message = `${timestamp}.${(req.body as Buffer).toString('utf8')}`;
    const ourSignature = crypto.createHmac('sha256', secret).update(message).digest('hex');

    const ours = Buffer.from(ourSignature);
    const theirs = Buffer.from(theirSignature);

    if (ours.length !== theirs.length || !crypto.timingSafeEqual(ours, theirs)) {
        Logger.error('[VoteWebhook] Invalid signature');
        res.status(401).send('Unauthorized');
        return;
    }

    next();
}

export const route: ApiRoute = {
    middleware: [rawBody(), verifyTopgg],
    async post(req: Request, res: Response): Promise<void> {
        let payload: TopGGVotePayload;
        try {
            payload = JSON.parse((req.body as Buffer).toString('utf8')) as TopGGVotePayload;
        } catch {
            Logger.error('[VoteWebhook] Failed to parse request body');
            res.status(400).send('Bad Request');
            return;
        }

        if (payload.type === 'webhook.test') {
            Logger.log('[VoteWebhook] Test webhook received, ignoring.');
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
    },
};
