import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { challengeService } from '../../../../services';
import { QuestionType, Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const { user_id, question_id, server_id, channel_id, username, type } = req.body as {
      user_id?: Snowflake;
      question_id?: number;
      server_id?: Snowflake;
      channel_id?: Snowflake | null;
      username?: string;
      type?: QuestionType;
    };

    if (!user_id || !question_id || !server_id || !username || !type) {
      res.status(400).json({ error: 'Missing required fields: user_id, question_id, server_id, username, type' });
      return;
    }

    try {
      const challenge = await challengeService.create(user_id, question_id, server_id, channel_id ?? null, username, type);
      res.status(200).json(challenge);
    } catch (error) {
      console.error('[POST /challenge]', error);
      res.status(500).json({ error: 'Failed to create challenge' });
    }
  }
};

export { route };
