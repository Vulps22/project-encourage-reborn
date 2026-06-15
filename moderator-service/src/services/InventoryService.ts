import { Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { InventoryItem } from '@vulps22/project-encourage-types';
import { Storable } from '../bot/types';

export class InventoryService {
  constructor(private db: DatabaseClient) {}

  async get(userId: Snowflake, storableId: Storable): Promise<InventoryItem | null> {
    return this.db.getInventoryItem(userId, storableId);
  }

  async add(userId: Snowflake, storableId: Storable, amount: number): Promise<InventoryItem> {
    return this.db.addInventoryItem(userId, storableId, amount);
  }

  async consume(userId: Snowflake, storableId: Storable, amount: number): Promise<InventoryItem | false> {
    return this.db.consumeInventoryItem(userId, storableId, amount);
  }
}
