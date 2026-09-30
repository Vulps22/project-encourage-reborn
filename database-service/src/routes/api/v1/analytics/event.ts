import { ApiRoute } from '@vulps22/pathfinder';
import { analyticsService } from '../../../../services';
import { AnalyticsInteractionType, AnalyticsOrigin } from '../../../../services/AnalyticsService';
import { Snowflake } from '@vulps22/project-encourage-types';
import { dsMiddleware } from '../../../../middleware/dsAuth';

// service is derived from the authenticated consumer, never trusted from
// the request body — a caller can't spoof which bot logged the event.
const CONSUMER_TO_SERVICE: Partial<Record<string, AnalyticsOrigin>> = {
  PE: 'bs',
  MS: 'ms',
};

const route: ApiRoute = {
  middleware: dsMiddleware,
  async post(req, res): Promise<void> {
    const service = CONSUMER_TO_SERVICE[req.consumer ?? ''];
    if (!service) {
      res.status(403).json({ error: 'This consumer cannot log analytics events' });
      return;
    }

    const { interaction_type, interaction_name, user_id, guild_id } = req.body as {
      interaction_type?: AnalyticsInteractionType;
      interaction_name?: string;
      user_id?: Snowflake;
      guild_id?: Snowflake;
    };

    if (!interaction_type || !interaction_name || !user_id) {
      res.status(400).json({ error: 'Missing required fields: interaction_type, interaction_name, user_id' });
      return;
    }

    if (interaction_type !== 'command' && interaction_type !== 'button') {
      res.status(400).json({ error: 'Invalid interaction_type. Must be one of: command, button' });
      return;
    }

    try {
      await analyticsService.logEvent(service, interaction_type, interaction_name, user_id, guild_id ?? null);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('[POST /analytics/event]', error);
      res.status(500).json({ error: 'Failed to log analytics event' });
    }
  }
};

export { route };
