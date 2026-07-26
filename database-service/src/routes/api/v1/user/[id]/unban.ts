import { ApiRoute } from '@vulps22/pathfinder';
import { userService } from '../../../../../services';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const { id } = req.params as { id: string };

    try {
      const user = await userService.unban(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('[PATCH /user/:id/unban]', error);
      res.status(500).json({ error: 'Failed to unban user' });
    }
  }
};

export { route };
