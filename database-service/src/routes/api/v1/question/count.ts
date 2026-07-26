import { ApiRoute } from '@vulps22/pathfinder';
import { questionService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { userId, serverId, approved, banned } = req.query as {
      userId?: string;
      serverId?: string;
      approved?: string;
      banned?: string;
    };

    if (!userId && !serverId) {
      res.status(400).json({ error: 'Missing required query param: userId or serverId' });
      return;
    }

    const approvedFilter = approved !== undefined ? approved === 'true' : undefined;
    const bannedFilter = banned !== undefined ? banned === 'true' : undefined;

    try {
      let count: number;

      if (userId) {
        count = await questionService.countByUser(userId, approvedFilter, bannedFilter);
      } else {
        count = await questionService.countByServer(serverId!, approvedFilter, bannedFilter);
      }

      res.status(200).json({ count });
    } catch (error) {
      console.error('[GET /question/count]', error);
      res.status(500).json({ error: 'Failed to count questions' });
    }
  },
};

export { route };
