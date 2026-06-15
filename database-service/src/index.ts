import { createServer } from '@vulps22/dynamic-endpoint-router';
import { join } from 'path';
import { initialiseSecrets } from './config/secrets';

initialiseSecrets();

createServer({
  port: process.env.DS_PORT ? parseInt(process.env.DS_PORT) : 3000,
  routesPath: join(__dirname, 'routes'),
}).catch(console.error);
