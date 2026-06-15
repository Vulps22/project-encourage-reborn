import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { serverService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason?: string };

    if (!reason) {
      res.status(400).json({ error: 'Missing required field: reason' });
      return;
    }

    try {
      const count = await serverService.banByOwner(id, reason);
      res.status(200).json({ count });
    } catch (error) {
      console.error('[POST /user/:id/ban-servers]', error);
      res.status(500).json({ error: 'Failed to ban servers' });
    }
  },
};

export { route };
