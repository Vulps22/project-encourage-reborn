import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Storable } from '@vulps22/project-encourage-types';

export class StorableService {
  constructor(private db: DatabaseClient) {}

  async get(id: string): Promise<Storable | null> {
    return this.db.getStorable(id);
  }

  async list(): Promise<Storable[]> {
    return this.db.listStorables();
  }
}
