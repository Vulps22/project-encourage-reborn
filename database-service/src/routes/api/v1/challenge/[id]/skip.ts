import { ApiRoute } from '@vulps22/pathfinder';
import { challengeService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    try {
      const challenge = await challengeService.skip(id);

      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      res.status(200).json(challenge);
    } catch (error) {
      console.error('[PATCH /challenge/:id/skip]', error);
      res.status(500).json({ error: 'Failed to skip challenge' });
    }
  }
};

export { route };
