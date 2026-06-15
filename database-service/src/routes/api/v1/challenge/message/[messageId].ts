import { ApiRoute } from '@vulps22/dynamic-endpoint-router';
import { challengeService } from '../../../../../services';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../../middleware/dsAuth';

const route: ApiRoute = {
  middleware: dsMiddleware,
  async get(req, res): Promise<void> {
    const { messageId } = req.params as { messageId: Snowflake };

    try {
      const challenge = await challengeService.getByMessageId(messageId);

      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      res.status(200).json(challenge);
    } catch (error) {
      console.error('[GET /challenge/message/:messageId]', error);
      res.status(500).json({ error: 'Failed to fetch challenge' });
    }
  }
};

export { route };
