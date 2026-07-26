import { ApiRoute } from '@vulps22/pathfinder';
import { userService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const count = await userService.getBannedServerCount(id);
      res.status(200).json({ count });
    } catch (error) {
      console.error('[GET /user/:id/banned-server-count]', error);
      res.status(500).json({ error: 'Failed to get banned server count' });
    }
  },
};

export { route };
