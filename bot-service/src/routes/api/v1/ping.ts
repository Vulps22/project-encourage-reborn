import { ApiRoute } from '@vulps22/pathfinder';

export const route: ApiRoute = {
    async get(_req, res): Promise<void> {
        res.status(200).json({ message: 'OK' });
    },
};
