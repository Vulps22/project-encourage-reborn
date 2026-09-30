import { ApiRoute } from '@vulps22/pathfinder';
import { entitlementService } from '../../../../services';
import { ClaimableEntitlement } from '../../../../services/EntitlementService';
import { dsMiddleware } from '../../../../middleware/dsAuth';

/**
 * An entitlement claim is BS reserving an entitlement for fulfilment. POST claims it
 * (only the first claim wins), DELETE releases a claim whose fulfilment failed, and
 * PATCH records that it has been consumed with Discord.
 */
const route: ApiRoute = {
  middleware: dsMiddleware,

  async post(req, res): Promise<void> {
    const { entitlement } = req.body as { entitlement?: Partial<ClaimableEntitlement> };

    if (!entitlement?.id || !entitlement.skuId || !entitlement.userId || typeof entitlement.type !== 'number') {
      res.status(400).json({ error: 'Missing required fields: entitlement.id, entitlement.skuId, entitlement.userId, entitlement.type' });
      return;
    }

    try {
      const claimed = await entitlementService.claim(entitlement as ClaimableEntitlement);

      if (!claimed) {
        res.status(409).json({ error: 'Entitlement has already been claimed' });
        return;
      }

      res.status(201).json(claimed);
    } catch (error) {
      console.error('[POST /entitlement/claim]', error);
      res.status(500).json({ error: 'Failed to claim entitlement' });
    }
  },

  async delete(req, res): Promise<void> {
    const { id } = req.body as { id?: string };

    if (!id) {
      res.status(400).json({ error: 'Missing required field: id' });
      return;
    }

    try {
      const released = await entitlementService.release(id);

      if (!released) {
        res.status(404).json({ error: 'No releasable claim found for this entitlement' });
        return;
      }

      res.status(200).json({ released: true });
    } catch (error) {
      console.error('[DELETE /entitlement/claim]', error);
      res.status(500).json({ error: 'Failed to release entitlement claim' });
    }
  },

  async patch(req, res): Promise<void> {
    const { id, consumed } = req.body as { id?: string; consumed?: boolean };

    if (!id || consumed !== true) {
      res.status(400).json({ error: 'Missing required fields: id, consumed (true)' });
      return;
    }

    try {
      const updated = await entitlementService.markConsumed(id);

      if (!updated) {
        res.status(404).json({ error: 'Entitlement has not been claimed' });
        return;
      }

      res.status(200).json(updated);
    } catch (error) {
      console.error('[PATCH /entitlement/claim]', error);
      res.status(500).json({ error: 'Failed to mark entitlement consumed' });
    }
  },
};

export { route };
