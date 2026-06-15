import { DatabaseService } from '../db/DatabaseService';

export interface InventoryItem {
  id: number;
  user_id: string;
  storable_id: string;
  qty: number;
}

export class InventoryService {
  constructor(private db: DatabaseService) {}

  async get(userId: string, storableId: string): Promise<InventoryItem | null> {
    return this.db.get<InventoryItem>('user', 'inventory', {
      user_id: userId,
      storable_id: storableId,
    });
  }

  async add(userId: string, storableId: string, amount: number): Promise<InventoryItem> {
    const result = await this.db.execute(
      `INSERT INTO "user"."inventory" ("user_id", "storable_id", "qty")
       VALUES ($1, $2, $3)
       ON CONFLICT ("user_id", "storable_id") DO UPDATE SET "qty" = "user"."inventory"."qty" + EXCLUDED."qty"
       RETURNING *`,
      [userId, storableId, amount]
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to add to inventory');
    }

    return result.rows[0] as InventoryItem;
  }

  /**
   * Decrement qty by amount if sufficient stock exists.
   * Returns the updated item, or null if qty would go below zero.
   */
  async consume(userId: string, storableId: string, amount: number): Promise<InventoryItem | null> {
    const result = await this.db.execute(
      `UPDATE "user"."inventory" SET "qty" = "qty" - $1
       WHERE "user_id" = $2 AND "storable_id" = $3 AND "qty" >= $1
       RETURNING *`,
      [amount, userId, storableId]
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as InventoryItem;
  }
}
