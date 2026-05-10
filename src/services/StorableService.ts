import { dsClient, DSError } from '../client';
import { Storable } from '@vulps22/project-encourage-types';

export class StorableService {
  async get(id: string): Promise<Storable | null> {
    try {
      return await dsClient.get<Storable>('/storable/:id', { id });
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async list(): Promise<Storable[]> {
    return await dsClient.get<Storable[]>('/storable');
  }
}
