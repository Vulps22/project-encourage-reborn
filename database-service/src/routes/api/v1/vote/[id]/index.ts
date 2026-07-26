import { ApiRoute } from '@vulps22/pathfinder';
import { voteService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    try {
      const votes = await voteService.init(id);
      res.status(200).json(votes);
    } catch (error) {
      console.error('[POST /vote/:id]', error);
      res.status(500).json({ error: 'Failed to init vote tracking' });
    }
  },

  async get(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    try {
      const votes = await voteService.getVotes(id);

      if (!votes) {
        res.status(404).json({ error: 'Vote tracking not found' });
        return;
      }

      res.status(200).json(votes);
    } catch (error) {
      console.error('[GET /vote/:id]', error);
      res.status(500).json({ error: 'Failed to fetch votes' });
    }
  }
};

export { route };
