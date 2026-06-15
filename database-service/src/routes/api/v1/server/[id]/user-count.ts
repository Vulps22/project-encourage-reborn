import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { serverService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const count = await serverService.getUserCount(id);
      res.status(200).json({ count });
    } catch (error) {
      console.error('[GET /server/:id/user-count]', error);
      res.status(500).json({ error: 'Failed to get user count' });
    }
  },
};

export { route };
