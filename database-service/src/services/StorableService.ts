import { DatabaseService } from '../db/DatabaseService';

export interface Storable {
  id: string;
  name: string;
}

export class StorableService {
  constructor(private db: DatabaseService) {}

  async list(): Promise<Storable[]> {
    return this.db.list<Storable>('core', 'storables');
  }

  async getById(id: string): Promise<Storable | null> {
    return this.db.get<Storable>('core', 'storables', { id });
  }
}
