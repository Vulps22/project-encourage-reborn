import { ApiRoute } from '@vulps22/pathfinder';

const route: ApiRoute = {
  middleware: [],
  async get(_req, res): Promise<void> {
    res.status(200).json({ message: 'OK' });
  }
};

export { route };
