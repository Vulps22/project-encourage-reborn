import { Snowflake } from 'discord.js';
import { dsClient, DSError } from '../client';
import { InventoryItem } from '@vulps22/project-encourage-types';

export class InventoryService {
  async get(userId: Snowflake, storableId: string): Promise<InventoryItem | null> {
    try {
      return await dsClient.getInventoryItem(userId, storableId);
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async add(userId: Snowflake, storableId: string, amount: number): Promise<InventoryItem> {
    return await dsClient.addInventoryItem(userId, storableId, amount);
  }

  async consume(userId: Snowflake, storableId: string, amount: number): Promise<InventoryItem | false> {
    return dsClient.consumeInventoryItem(userId, storableId, amount);
  }
}
