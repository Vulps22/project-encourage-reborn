import { ApiRoute } from '@vulps22/pathfinder';
import { reportService } from '../../../../services';
import { ReportStatus, Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    try {
      const report = await reportService.getById(id);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.status(200).json(report);
    } catch (error) {
      console.error('[GET /report/:id]', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  },

  async patch(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    const { status, moderator_id, message_id, ban_reason } = req.body as {
      status?: ReportStatus;
      moderator_id?: Snowflake | null;
      message_id?: Snowflake | null;
      ban_reason?: string | null;
    };

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (moderator_id !== undefined) updateData.moderator_id = moderator_id;
    if (message_id !== undefined) updateData.message_id = message_id;
    if (ban_reason !== undefined) updateData.ban_reason = ban_reason;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields provided to update' });
      return;
    }

    try {
      const report = await reportService.update(id, updateData);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.status(200).json(report);
    } catch (error) {
      console.error('[PATCH /report/:id]', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  },
};

export { route };
