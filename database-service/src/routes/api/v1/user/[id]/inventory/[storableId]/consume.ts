import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { inventoryService } from '../../../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { id, storableId } = req.params as { id: Snowflake; storableId: string };
    const { amount } = req.body as { amount?: number };

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Missing or invalid field: amount (positive number)' });
      return;
    }

    try {
      const item = await inventoryService.consume(id, storableId, amount);

      if (!item) {
        res.status(409).json({ error: 'Insufficient quantity' });
        return;
      }

      res.status(200).json(item);
    } catch (error) {
      console.error('[POST /user/:id/inventory/:storableId/consume]', error);
      res.status(500).json({ error: 'Failed to consume inventory item' });
    }
  }
};

export { route };
