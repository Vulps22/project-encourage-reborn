import { Snowflake } from 'discord.js';
import { dsClient, DSError } from '../client';
import { InventoryItem } from '../interface';
import { Storable } from '../types';

export class InventoryService {
  async get(userId: Snowflake, storableId: Storable): Promise<InventoryItem | null> {
    try {
      return await dsClient.get<InventoryItem>('/user/:id/inventory/:storableId', {
        id: userId,
        storableId,
      });
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async add(userId: Snowflake, storableId: Storable, amount: number): Promise<InventoryItem> {
    return await dsClient.post<InventoryItem>('/user/:id/inventory/:storableId', {
      id: userId,
      storableId,
    }, { amount });
  }

  async consume(userId: Snowflake, storableId: Storable, amount: number): Promise<InventoryItem | false> {
    try {
      return await dsClient.post<InventoryItem>('/user/:id/inventory/:storableId/consume', {
        id: userId,
        storableId,
      }, { amount });
    } catch (error) {
      if (error instanceof DSError && error.status === 409) return false;
      throw error;
    }
  }
}
