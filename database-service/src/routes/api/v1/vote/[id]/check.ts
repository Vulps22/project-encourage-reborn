import { ApiRoute } from '@vulps22/pathfinder';
import { voteService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);
    const { userId } = req.query as { userId?: string };

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: 'Missing required query param: userId' });
      return;
    }

    try {
      const voted = await voteService.hasUserVoted(id, userId);
      res.status(200).json({ voted });
    } catch (error) {
      console.error('[GET /vote/:id/check]', error);
      res.status(500).json({ error: 'Failed to check vote status' });
    }
  }
};

export { route };
