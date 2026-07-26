import { ApiRoute } from '@vulps22/pathfinder';
import { challengeService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    try {
      const challenge = await challengeService.getById(id);

      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      res.status(200).json(challenge);
    } catch (error) {
      console.error('[GET /challenge/:id]', error);
      res.status(500).json({ error: 'Failed to fetch challenge' });
    }
  }
};

export { route };
