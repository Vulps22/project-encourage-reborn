import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { voteService } from '../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);
    const { user_id } = req.body as { user_id?: Snowflake };

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    if (!user_id) {
      res.status(400).json({ error: 'Missing required field: user_id' });
      return;
    }

    try {
      const votes = await voteService.vote(id, user_id, 'failed');
      res.status(200).json(votes);
    } catch (error) {
      if (error instanceof Error && error.message.includes('ALREADY_VOTED')) {
        res.status(409).json({ error: 'User has already voted on this challenge' });
        return;
      }
      console.error('[POST /vote/:id/fail]', error);
      res.status(500).json({ error: 'Failed to record vote' });
    }
  }
};

export { route };
