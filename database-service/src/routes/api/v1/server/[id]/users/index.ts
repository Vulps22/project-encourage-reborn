import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { serverService } from '../../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { id } = req.params as { id: Snowflake };
    const { user_id } = req.body as { user_id?: Snowflake };

    if (!user_id) {
      res.status(400).json({ error: 'Missing required field: user_id' });
      return;
    }

    try {
      await serverService.addUser(id, user_id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[POST /server/:id/users]', error);
      res.status(500).json({ error: 'Failed to register user to server' });
    }
  }
};

export { route };
