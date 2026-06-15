import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { Request, Response } from 'express';
import { ServerProfileBuilder } from '../../../bot/builders/ServerProfileBuilder';
import { ModerationLogger } from '../../../bot/utils/ModerationLogger';
import { serverService } from '../../../services';
import { msMiddleware } from '../../../middleware/msAuth';

export const route: ApiRoute = {
  middleware: msMiddleware,
  async post(req: Request, res: Response): Promise<void> {
    const { id, name, user_id } = req.body as {
      id?: string;
      name?: string;
      user_id?: string;
    };

    if (!id || !name || !user_id) {
      res.status(400).json({ error: 'Missing required fields: id, name, user_id' });
      return;
    }

    await serverService.getOrCreateServer(id, name, user_id);

    const profile = await new ServerProfileBuilder().getServerProfile(id);
    if (!profile) {
      res.status(404).json({ error: 'Server profile could not be built after upsert' });
      return;
    }

    const message = await ModerationLogger.logServer(profile);
    if (message) {
      await serverService.updateServerSettings(id, { message_id: message.id });
    }

    res.status(200).json({ success: true });
  },
};
