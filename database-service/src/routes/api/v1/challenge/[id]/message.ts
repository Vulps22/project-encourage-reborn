import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { challengeService } from '../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async patch(req, res): Promise<void> {
    const id = parseInt(req.params['id'] as string);
    const { message_id } = req.body as { message_id?: Snowflake };

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid challenge id' });
      return;
    }

    if (!message_id) {
      res.status(400).json({ error: 'Missing required field: message_id' });
      return;
    }

    try {
      await challengeService.setMessageId(id, message_id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[PATCH /challenge/:id/message]', error);
      res.status(500).json({ error: 'Failed to set message id' });
    }
  }
};

export { route };
