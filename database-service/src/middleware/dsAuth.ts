import { auth, jsonBody, Middleware } from '@vulps22/dynamic-endpoint-router';

export const dsMiddleware: Middleware[] = [
  jsonBody(),
  auth.bearer({
    consumers: {
      PE:      process.env.DS_PE_API_SECRET,
      MS:      process.env.DS_MS_API_SECRET,
      POSTMAN: process.env.DS_POSTMAN_API_SECRET,
    },
    blockedInEnvironment: { prod: ['POSTMAN'], stage: ['POSTMAN'] },
    environment: process.env.ENVIRONMENT,
  }),
];
