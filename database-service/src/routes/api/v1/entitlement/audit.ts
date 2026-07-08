import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { entitlementService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

interface AuditBody {
  id?: string;
  data?: unknown;
}

const route: ApiRoute = {
  middleware: dsMiddleware,

  async post(req, res): Promise<void> {
    const { id, data } = req.body as AuditBody;

    if (!id || data === undefined) {
      res.status(400).json({ error: 'Missing required fields: id, data' });
      return;
    }

    try {
      const audit = await entitlementService.record(id, 'create', data, 'gateway');
      res.status(201).json(audit);
    } catch (error) {
      console.error('[POST /entitlement/audit]', error);
      res.status(500).json({ error: 'Failed to record entitlement audit event' });
    }
  },

  async patch(req, res): Promise<void> {
    const { id, data } = req.body as AuditBody;

    if (!id || data === undefined) {
      res.status(400).json({ error: 'Missing required fields: id, data' });
      return;
    }

    try {
      const audit = await entitlementService.record(id, 'update', data, 'gateway');
      res.status(200).json(audit);
    } catch (error) {
      console.error('[PATCH /entitlement/audit]', error);
      res.status(500).json({ error: 'Failed to record entitlement audit event' });
    }
  },

  // Note: this is not a real delete. premium.audit / entitlement.audit is append-only -
  // the DELETE verb here means "Discord fired entitlementDelete, log that fact", matching
  // Discord's own gateway event. It inserts a new audit row, it never removes one.
  async delete(req, res): Promise<void> {
    const { id, data } = req.body as AuditBody;

    if (!id || data === undefined) {
      res.status(400).json({ error: 'Missing required fields: id, data' });
      return;
    }

    try {
      const audit = await entitlementService.record(id, 'delete', data, 'gateway');
      res.status(200).json(audit);
    } catch (error) {
      console.error('[DELETE /entitlement/audit]', error);
      res.status(500).json({ error: 'Failed to record entitlement audit event' });
    }
  },
};

export { route };
