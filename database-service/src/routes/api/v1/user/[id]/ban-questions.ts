import { ApiRoute } from '@vulps22/pathfinder';
import { questionService } from '../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { id } = req.params as { id: Snowflake };
    const { moderator_id } = req.body as { moderator_id?: Snowflake };

    if (!moderator_id) {
      res.status(400).json({ error: 'Missing required field: moderator_id' });
      return;
    }

    try {
      const count = await questionService.banAllByUser(id, moderator_id);
      res.status(200).json({ count });
    } catch (error) {
      console.error('[POST /user/:id/ban-questions]', error);
      res.status(500).json({ error: 'Failed to ban questions' });
    }
  },
};

export { route };
