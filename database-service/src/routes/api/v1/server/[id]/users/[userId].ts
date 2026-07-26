import { ApiRoute } from '@vulps22/pathfinder';
import { serverService } from '../../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async delete(req, res): Promise<void> {
    const { id, userId } = req.params as { id: Snowflake; userId: Snowflake };

    try {
      const removed = await serverService.removeUser(id, userId);

      if (!removed) {
        res.status(404).json({ error: 'User not found in server' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[DELETE /server/:id/users/:userId]', error);
      res.status(500).json({ error: 'Failed to remove user from server' });
    }
  }
};

export { route };
