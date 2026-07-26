import { ApiRoute } from '@vulps22/pathfinder';
import { questionService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { q } = req.query as { q?: string };

    try {
      const results = await questionService.search(q ?? '');
      res.status(200).json(results);
    } catch (error) {
      console.error('[GET /question/search]', error);
      res.status(500).json({ error: 'Failed to search questions' });
    }
  },
};

export { route };
