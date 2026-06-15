import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { inventoryService } from '../../../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { id, storableId } = req.params as { id: Snowflake; storableId: string };

    try {
      const item = await inventoryService.get(id, storableId);

      if (!item) {
        res.status(404).json({ error: 'Inventory item not found' });
        return;
      }

      res.status(200).json(item);
    } catch (error) {
      console.error('[GET /user/:id/inventory/:storableId]', error);
      res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
  },

  async post(req, res): Promise<void> {
    const { id, storableId } = req.params as { id: Snowflake; storableId: string };
    const { amount } = req.body as { amount?: number };

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Missing or invalid field: amount (positive number)' });
      return;
    }

    try {
      const item = await inventoryService.add(id, storableId, amount);
      res.status(200).json(item);
    } catch (error) {
      console.error('[POST /user/:id/inventory/:storableId]', error);
      res.status(500).json({ error: 'Failed to add to inventory' });
    }
  }
};

export { route };
