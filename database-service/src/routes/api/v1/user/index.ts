import { ApiRoute } from '@vulps22/pathfinder';
import { userService } from '../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { id, username } = req.body as { id?: Snowflake; username?: string };

    if (!id || !username) {
      res.status(400).json({ error: 'Missing required fields: id, username' });
      return;
    }

    try {
      const user = await userService.upsert({ id, username });
      res.status(200).json(user);
    } catch (error) {
      console.error('[POST /user]', error);
      res.status(500).json({ error: 'Failed to upsert user' });
    }
  }
};

export { route };
