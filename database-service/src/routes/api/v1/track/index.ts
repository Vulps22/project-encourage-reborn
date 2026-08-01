import { ApiRoute } from '@vulps22/pathfinder';
import { trackService } from '../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { user_id, server_id, server_owner_id } = req.body as {
      user_id?: Snowflake;
      server_id?: Snowflake;
      server_owner_id?: Snowflake;
    };

    if (!user_id || !server_id || !server_owner_id) {
      res.status(400).json({ error: 'Missing required fields: user_id, server_id, server_owner_id' });
      return;
    }

    try {
      await trackService.track(user_id, server_id, server_owner_id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[POST /track]', error);
      res.status(500).json({ error: 'Failed to track interaction' });
    }
  }
};

export { route };
