import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { voteService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);
    const { result } = req.body as { result?: 'done' | 'failed' | 'skipped' };

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    if (!result || !['done', 'failed', 'skipped'].includes(result)) {
      res.status(400).json({ error: 'Missing or invalid field: result (done, failed, skipped)' });
      return;
    }

    try {
      const votes = await voteService.finalise(id, result);

      if (!votes) {
        res.status(404).json({ error: 'Vote tracking not found' });
        return;
      }

      res.status(200).json(votes);
    } catch (error) {
      console.error('[PATCH /vote/:id/finalise]', error);
      res.status(500).json({ error: 'Failed to finalise challenge' });
    }
  }
};

export { route };
