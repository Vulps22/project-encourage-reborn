import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { configService } from '../../../../services';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(_req, res): Promise<void> {
    try {
      const config = await configService.getConfig();

      if (!config) {
        res.status(404).json({ error: 'Config not found — run db:install' });
        return;
      }

      res.status(200).json(config);
    } catch (error) {
      console.error('[GET /config]', error);
      res.status(500).json({ error: 'Failed to fetch config' });
    }
  }
};

export { route };
