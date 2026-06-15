import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { questionService } from '../../../../services';
import { QuestionType, Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    console.log(`[DEBUG DS/POST /question] Request received — body=${JSON.stringify(req.body)}`);
    const { type, question, user_id, server_id } = req.body as {
      type?: QuestionType;
      question?: string;
      user_id?: Snowflake;
      server_id?: Snowflake;
    };

    if (!type || !question || !user_id || !server_id) {
      console.log(`[DEBUG DS/POST /question] Rejected: missing fields — type=${type} question=${!!question} user_id=${user_id} server_id=${server_id}`);
      res.status(400).json({ error: 'Missing required fields: type, question, user_id, server_id' });
      return;
    }

    if (!Object.values(QuestionType).includes(type)) {
      console.log(`[DEBUG DS/POST /question] Rejected: invalid type="${type}"`);
      res.status(400).json({ error: `Invalid type. Must be one of: ${Object.values(QuestionType).join(', ')}` });
      return;
    }

    try {
      console.log(`[DEBUG DS/POST /question] Calling questionService.create`);
      const created = await questionService.create(type, question, user_id, server_id);
      console.log(`[DEBUG DS/POST /question] Created question.id=${created.id} — responding 201`);
      res.status(201).json(created);
    } catch (error) {
      console.error('[POST /question]', error);
      res.status(500).json({ error: 'Failed to create question' });
    }
  }
};

export { route };
