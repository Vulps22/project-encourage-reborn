import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { Request, Response } from 'express';
import { TargetType } from '@vulps22/project-encourage-types';
import { reportService } from '../../../services';
import { msMiddleware } from '../../../middleware/msAuth';

export const route: ApiRoute = {
  middleware: msMiddleware,
  async post(req: Request, res: Response): Promise<void> {
    const { senderId, offenderId, content, type, serverId, reason } = req.body as {
      senderId?: string;
      offenderId?: string;
      content?: string | null;
      type?: TargetType;
      serverId?: string;
      reason?: string;
    };

    if (!senderId || !offenderId || !type || !serverId) {
      res.status(400).json({ error: 'Missing required fields: senderId, offenderId, type, serverId' });
      return;
    }

    try {
      const report = await reportService.createReport(
        senderId,
        offenderId,
        content ?? null,
        type,
        serverId,
        reason
      );

      res.status(200).json({ success: true, reportId: report.id });
    } catch (error) {
      console.error('[POST /api/v1/report]', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  },
};
