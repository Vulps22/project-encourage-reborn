import { DatabaseService } from './DatabaseService';
import { Storable } from '../interface';

export class StorableService {
  constructor(private db: DatabaseService) {}

  async get(id: string): Promise<Storable | null> {
    return this.db.get<Storable>('core', 'storables', { id });
  }

  async list(): Promise<Storable[]> {
    return this.db.list<Storable>('core', 'storables');
  }
}
