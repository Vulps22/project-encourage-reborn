import { Urls } from '../config';
import { DatabaseClient } from './DatabaseClient';

export { DatabaseClient, DSError } from './DatabaseClient';

export const dsClient = new DatabaseClient(Urls.DS_URL, process.env.DS_TOKEN ?? '');
