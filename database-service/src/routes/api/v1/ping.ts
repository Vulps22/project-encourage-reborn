import { ApiRoute } from '@vulps22/dynamic-endpoint-router';

const route: ApiRoute = {
  middleware: [],
  async get(_req, res): Promise<void> {
    res.status(200).json({ message: 'OK' });
  }
};

export { route };
