// Set env vars before any modules load so dsMiddleware captures the right secrets
process.env.DS_PE_API_SECRET      = 'test-pe-secret';
process.env.DS_MS_API_SECRET      = 'test-ms-secret';
process.env.DS_POSTMAN_API_SECRET = 'test-postman-secret';
process.env.ENVIRONMENT           = 'dev';
