import { auth, jsonBody, Middleware } from '@vulps22/dynamic-endpoint-router';

export const msMiddleware: Middleware[] = [
  jsonBody(),
  auth.bearer({
    consumers: {
      PE: process.env.MS_PE_API_SECRET,
    },
  }),
];
