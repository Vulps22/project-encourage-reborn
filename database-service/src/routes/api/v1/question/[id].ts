import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { questionService } from '../../../../services';
import { Question } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    try {
      const question = await questionService.getById(id);

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      res.status(200).json(question);
    } catch (error) {
      console.error('[GET /question/:id]', error);
      res.status(500).json({ error: 'Failed to fetch question' });
    }
  },

  async patch(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);
    const data = req.body as Partial<Question>;

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    try {
      const question = await questionService.update(id, data);

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      res.status(200).json(question);
    } catch (error) {
      console.error('[PATCH /question/:id]', error);
      res.status(500).json({ error: 'Failed to update question' });
    }
  }
};

export { route };
