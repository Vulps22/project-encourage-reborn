import { ApiRoute } from '@vulps22/pathfinder';
import { configService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { locked } = req.body as { locked?: boolean };

    if (typeof locked !== 'boolean') {
      res.status(400).json({ error: 'Missing required field: locked (boolean)' });
      return;
    }

    try {
      const config = await configService.setLocked(locked);

      if (!config) {
        res.status(404).json({ error: 'Config not found — run db:install' });
        return;
      }

      res.status(200).json(config);
    } catch (error) {
      console.error('[POST /config/lockdown]', error);
      res.status(500).json({ error: 'Failed to update lockdown state' });
    }
  }
};

export { route };
