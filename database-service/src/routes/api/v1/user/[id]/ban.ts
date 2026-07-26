import { ApiRoute } from '@vulps22/pathfinder';
import { userService } from '../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const { id } = req.params as { id: string };
    const { ban_reason, ban_message_id } = req.body as {
      ban_reason?: string;
      ban_message_id?: Snowflake;
    };

    if (!ban_reason) {
      res.status(400).json({ error: 'Missing required field: ban_reason' });
      return;
    }

    try {
      const user = await userService.ban(id, ban_reason, ban_message_id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('[PATCH /user/:id/ban]', error);
      res.status(500).json({ error: 'Failed to ban user' });
    }
  }
};

export { route };
