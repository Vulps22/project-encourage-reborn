import { ApiRoute } from '@vulps22/pathfinder';
import { entitlementService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

/**
 * Revoke a claimed entitlement (refund / Discord entitlementDelete). Only the first
 * revoke succeeds - a 409 tells BS there is nothing to reverse.
 */
const route: ApiRoute = {
  middleware: dsMiddleware,

  async post(req, res): Promise<void> {
    const { id } = req.body as { id?: string };

    if (!id) {
      res.status(400).json({ error: 'Missing required field: id' });
      return;
    }

    try {
      const revoked = await entitlementService.revoke(id);

      if (!revoked) {
        res.status(409).json({ error: 'Entitlement was never claimed or is already revoked' });
        return;
      }

      res.status(200).json(revoked);
    } catch (error) {
      console.error('[POST /entitlement/revoke]', error);
      res.status(500).json({ error: 'Failed to revoke entitlement' });
    }
  },
};

export { route };
