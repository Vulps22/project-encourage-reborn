import { dsClient, DSError } from '../client';
import { Storable } from '@vulps22/project-encourage-types';

export class StorableService {
  async get(id: string): Promise<Storable | null> {
    try {
      return await dsClient.getStorable(id);
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async list(): Promise<Storable[]> {
    return dsClient.listStorables();
  }
}
