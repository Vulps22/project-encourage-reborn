import { ApiRoute } from '@vulps22/pathfinder';
import { storableService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const storable = await storableService.getById(id);

      if (!storable) {
        res.status(404).json({ error: 'Storable not found' });
        return;
      }

      res.status(200).json(storable);
    } catch (error) {
      console.error('[GET /storable/:id]', error);
      res.status(500).json({ error: 'Failed to fetch storable' });
    }
  }
};

export { route };
