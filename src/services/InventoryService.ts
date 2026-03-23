import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { InventoryItem } from '../interface';
import { Storable } from '../types';

export class InventoryService {
  constructor(private db: DatabaseService) {}

  async get(userId: Snowflake, storableId: Storable): Promise<InventoryItem | null> {
    return this.db.get<InventoryItem>('user', 'inventory', { user_id: userId, storable_id: storableId });
  }

  async add(userId: Snowflake, storableId: Storable, amount: number): Promise<InventoryItem> {
    const result = await this.db.execute(
      `INSERT INTO "user"."inventory" ("user_id", "storable_id", "qty")
       VALUES ($1, $2, $3)
       ON CONFLICT ("user_id", "storable_id") DO UPDATE SET "qty" = "user"."inventory"."qty" + EXCLUDED."qty"
       RETURNING *`,
      [userId, storableId, amount]
    );

    return result.rows![0] as InventoryItem;
  }

  async consume(userId: Snowflake, storableId: Storable, amount: number): Promise<InventoryItem | false> {
    const result = await this.db.execute(
      `UPDATE "user"."inventory" SET "qty" = "qty" - $1 WHERE "user_id" = $2 AND "storable_id" = $3 AND "qty" >= $1 RETURNING *`,
      [amount, userId, storableId]
    );

    if (!result.rows || result.rows.length === 0) {
      console.log(`User ${userId} does not have enough of storable ${storableId} to consume ${amount}. Returning false.`);
      return false;
    }

    return result.rows[0] as InventoryItem;
  }
}
