import { ApiRoute } from '@vulps22/pathfinder';
import { serverService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const server = await serverService.unban(id);

      if (!server) {
        res.status(404).json({ error: 'Server not found' });
        return;
      }

      res.status(200).json(server);
    } catch (error) {
      console.error('[PATCH /server/:id/unban]', error);
      res.status(500).json({ error: 'Failed to unban server' });
    }
  }
};

export { route };
