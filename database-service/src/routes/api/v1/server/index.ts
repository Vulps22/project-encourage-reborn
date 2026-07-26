import { ApiRoute } from '@vulps22/pathfinder';
import { serverService } from '../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { id, name, user_id } = req.body as {
      id?: Snowflake;
      name?: string;
      user_id?: Snowflake;
    };

    if (!id || !user_id) {
      res.status(400).json({ error: 'Missing required fields: id, user_id' });
      return;
    }

    try {
      const server = await serverService.upsert(id, name ?? null, user_id);
      res.status(200).json(server);
    } catch (error) {
      console.error('[POST /server]', error);
      res.status(500).json({ error: 'Failed to upsert server' });
    }
  }
};

export { route };
