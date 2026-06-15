import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { serverService } from '../../../../services';
import { Server } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const server = await serverService.getById(id);

      if (!server) {
        res.status(404).json({ error: 'Server not found' });
        return;
      }

      res.status(200).json(server);
    } catch (error) {
      console.error('[GET /server/:id]', error);
      res.status(500).json({ error: 'Failed to fetch server' });
    }
  },

  async patch(req, res): Promise<void> {
    const { id } = req.params as { id: string };
    const data = req.body as Partial<Server>;

    try {
      const server = await serverService.update(id, data);

      if (!server) {
        res.status(404).json({ error: 'Server not found' });
        return;
      }

      res.status(200).json(server);
    } catch (error) {
      console.error('[PATCH /server/:id]', error);
      res.status(500).json({ error: 'Failed to update server' });
    }
  },

  async delete(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const deleted = await serverService.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Server not found' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[DELETE /server/:id]', error);
      res.status(500).json({ error: 'Failed to delete server' });
    }
  }
};

export { route };
