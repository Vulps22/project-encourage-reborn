import { Urls } from '../config';
import { DatabaseClient } from './DatabaseClient';
import { ModerationClient } from './ModerationClient';

export { Client, ClientError } from './Client';
export { DatabaseClient, DSError } from './DatabaseClient';
export { ModerationClient, MSError } from './ModerationClient';

export const dsClient = new DatabaseClient(Urls.DS_URL, process.env.DS_TOKEN ?? '');
export const msClient = new ModerationClient(Urls.MS_URL, process.env.MS_TOKEN ?? '');
