import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { reportService } from '../../../../services';
import { ReportStatus, Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { offenderId, status } = req.query as {
      offenderId?: string;
      status?: string;
    };

    if (!offenderId) {
      res.status(400).json({ error: 'Missing required query param: offenderId' });
      return;
    }

    const statuses: ReportStatus[] = status
      ? (status.split(',').filter(s => Object.values(ReportStatus).includes(s as ReportStatus)) as ReportStatus[])
      : [ReportStatus.PENDING, ReportStatus.ACTIONING];

    try {
      const reports = await reportService.list(offenderId, statuses);
      res.status(200).json(reports);
    } catch (error) {
      console.error('[GET /report]', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  },

  async post(req, res): Promise<void> {
    const { type, reason, content, sender_id, offender_id, server_id, moderator_id, ban_reason } = req.body as {
      type?: string;
      reason?: string;
      content?: string | null;
      sender_id?: Snowflake;
      offender_id?: string;
      server_id?: Snowflake;
      moderator_id?: Snowflake | null;
      ban_reason?: string | null;
    };

    if (!type || !reason || !sender_id || !offender_id || !server_id) {
      res.status(400).json({ error: 'Missing required fields: type, reason, sender_id, offender_id, server_id' });
      return;
    }

    try {
      const report = await reportService.create({
        type,
        reason,
        content: content ?? null,
        status: ReportStatus.PENDING,
        sender_id,
        offender_id,
        server_id,
        moderator_id: moderator_id ?? null,
        ban_reason: ban_reason ?? null,
      });

      res.status(201).json(report);
    } catch (error) {
      console.error('[POST /report]', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  },
};

export { route };
