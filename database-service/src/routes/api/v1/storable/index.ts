import { ApiRoute } from '@vulps22/pathfinder';
import { storableService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(_req, res): Promise<void> {
    try {
      const storables = await storableService.list();
      res.status(200).json(storables);
    } catch (error) {
      console.error('[GET /storable]', error);
      res.status(500).json({ error: 'Failed to fetch storables' });
    }
  }
};

export { route };
