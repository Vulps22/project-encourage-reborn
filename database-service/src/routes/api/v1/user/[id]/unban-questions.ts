import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { questionService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const count = await questionService.unbanUserBanned(id);
      res.status(200).json({ count });
    } catch (error) {
      console.error('[POST /user/:id/unban-questions]', error);
      res.status(500).json({ error: 'Failed to unban questions' });
    }
  },
};

export { route };
