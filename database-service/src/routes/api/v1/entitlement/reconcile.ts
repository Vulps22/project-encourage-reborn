import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { entitlementService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

/** Shape of a raw Discord entitlement object, as returned by GET /applications/{id}/entitlements */
interface RawDiscordEntitlement {
  id: string;
  sku_id: string;
  [key: string]: unknown;
}

const route: ApiRoute = {
  middleware: dsMiddleware,

  async post(req, res): Promise<void> {
    const { entitlements } = req.body as { entitlements?: RawDiscordEntitlement[] };

    if (!Array.isArray(entitlements)) {
      res.status(400).json({ error: 'Missing required field: entitlements (array)' });
      return;
    }

    try {
      const fetchedIds = new Set<string>();

      for (const entitlement of entitlements) {
        fetchedIds.add(entitlement.id);

        const latest = await entitlementService.latestByEntitlementId(entitlement.id);

        if (!latest) {
          // No existing audit row for this entitlement - Discord has it, we never
          // captured its creation. Missed-create drift.
          await entitlementService.record(entitlement.id, 'create', entitlement, 'reconciliation');
          continue;
        }

        const latestData = typeof latest.data === 'string' ? JSON.parse(latest.data) : latest.data;
        if (entitlementService.hasDrifted(latestData, entitlement)) {
          // Discord's current state differs from what we last recorded. Missed-update drift.
          await entitlementService.record(entitlement.id, 'update', entitlement, 'reconciliation');
        }
      }

      // Anything we believe is still open that Discord no longer lists is a
      // missed-delete/refund drift.
      const openIds = await entitlementService.distinctOpenEntitlementIds();
      for (const openId of openIds) {
        if (!fetchedIds.has(openId)) {
          await entitlementService.record(openId, 'delete', { id: openId }, 'reconciliation');
        }
      }

      // Catalogue drift: a SKU Discord is selling that we don't have a purchasable
      // row for. Logged only, not written to entitlement.audit - that table is for
      // entitlement lifecycle only.
      const skuIds = new Set(entitlements.map((e) => e.sku_id));
      for (const skuId of skuIds) {
        const purchasable = await entitlementService.findPurchasableBySkuId(skuId);
        if (!purchasable) {
          console.error(`[POST /entitlement/reconcile] Catalogue drift: no purchasable found for sku_id ${skuId}`);
        }
      }

      res.status(200).json({ reconciled: entitlements.length });
    } catch (error) {
      console.error('[POST /entitlement/reconcile]', error);
      res.status(500).json({ error: 'Failed to reconcile entitlements' });
    }
  },
};

export { route };
