import { ApiRoute } from '@vulps22/pathfinder';
import { entitlementService } from '../../../../services';
import { PurchasableEnvironment } from '../../../../services/EntitlementService';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const ENVIRONMENTS: PurchasableEnvironment[] = ['dev', 'prod'];

// Query parameters rather than /purchasable/:id so further lookup strategies
// (by name slug, by environment, ...) can be added without new endpoints.
const route: ApiRoute = {
  middleware: dsMiddleware,

  async get(req, res): Promise<void> {
    const { sku, name, env } = req.query as { sku?: string; name?: string; env?: string };

    if (!sku && !name) {
      res.status(400).json({ error: 'Missing required query parameter: sku or name' });
      return;
    }

    if (env !== undefined && !ENVIRONMENTS.includes(env as PurchasableEnvironment)) {
      res.status(400).json({ error: 'Invalid env. Must be one of: dev, prod' });
      return;
    }

    try {
      const purchasable = await entitlementService.findPurchasable({
        sku_id: sku,
        name,
        environment: env as PurchasableEnvironment | undefined,
      });

      if (!purchasable) {
        res.status(404).json({ error: 'Purchasable not found' });
        return;
      }

      res.status(200).json(purchasable);
    } catch (error) {
      console.error('[GET /entitlement/purchasable]', error);
      res.status(500).json({ error: 'Failed to look up purchasable' });
    }
  },
};

export { route };
