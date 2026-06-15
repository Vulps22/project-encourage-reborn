import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { serverService } from '../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const { id } = req.params as { id: string };
    const { moderator_id, ban_reason } = req.body as {
      moderator_id?: Snowflake;
      ban_reason?: string;
    };

    if (!moderator_id || !ban_reason) {
      res.status(400).json({ error: 'Missing required fields: moderator_id, ban_reason' });
      return;
    }

    try {
      const server = await serverService.ban(id, moderator_id, ban_reason);

      if (!server) {
        res.status(404).json({ error: 'Server not found' });
        return;
      }

      res.status(200).json(server);
    } catch (error) {
      console.error('[PATCH /server/:id/ban]', error);
      res.status(500).json({ error: 'Failed to ban server' });
    }
  }
};

export { route };
