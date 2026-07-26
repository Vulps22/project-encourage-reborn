import { ApiRoute } from '@vulps22/pathfinder';
import { serverService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const count = await serverService.getBannedUserCount(id);
      res.status(200).json({ count });
    } catch (error) {
      console.error('[GET /server/:id/banned-user-count]', error);
      res.status(500).json({ error: 'Failed to get banned user count' });
    }
  },
};

export { route };
