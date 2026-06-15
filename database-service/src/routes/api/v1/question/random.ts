import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { questionService } from '../../../../services';
import { QuestionType } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { type } = req.query as { type?: string };

    if (type && !Object.values(QuestionType).includes(type as QuestionType)) {
      res.status(400).json({ error: `Invalid type. Must be one of: ${Object.values(QuestionType).join(', ')}` });
      return;
    }

    try {
      const question = await questionService.getRandom(type as QuestionType | undefined);

      if (!question) {
        res.status(404).json({ error: 'No questions available' });
        return;
      }

      res.status(200).json(question);
    } catch (error) {
      console.error('[GET /question/random]', error);
      res.status(500).json({ error: 'Failed to fetch random question' });
    }
  }
};

export { route };
