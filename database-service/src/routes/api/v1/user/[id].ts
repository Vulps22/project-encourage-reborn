import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { userService } from '../../../../services';
import { User } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const user = await userService.getById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('[GET /user/:id]', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  async patch(req, res): Promise<void> {
    const { id } = req.params as { id: string };
    const data = req.body as Partial<User>;

    try {
      const user = await userService.update(id, data);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('[PATCH /user/:id]', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
};

export { route };
