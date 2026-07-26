import { ApiRoute } from '@vulps22/pathfinder';
import { questionService } from '../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);
    const { moderator_id } = req.body as { moderator_id?: Snowflake };

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    if (!moderator_id) {
      res.status(400).json({ error: 'Missing required field: moderator_id' });
      return;
    }

    try {
      const question = await questionService.approve(id, moderator_id);

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      res.status(200).json(question);
    } catch (error) {
      console.error('[PATCH /question/:id/approve]', error);
      res.status(500).json({ error: 'Failed to approve question' });
    }
  }
};

export { route };
