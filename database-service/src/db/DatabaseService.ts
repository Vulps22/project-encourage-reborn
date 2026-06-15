import { Pool, PoolClient } from 'pg';

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
}

export interface MutationResult {
  affectedRows: number;
  insertId?: number;
  changedRows?: number;
  rows?: unknown[];
}

export interface DatabaseConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
}

export type TransactionCallback<T> = (db: DatabaseService) => Promise<T>;

export class DatabaseService {
  private pool: Pool;
  private transactionClient?: PoolClient;

  constructor(config: DatabaseConfig) {
    try {
      this.pool = new Pool({
        host: config.host,
        port: config.port || 5432,
        user: config.user,
        password: config.password,
        database: config.database,
        max: config.connectionLimit || 10,
      });
    } catch (error) {
      throw new Error(`Failed to create database pool: ${this.getErrorMessage(error)}`);
    }
  }

  async get<T = unknown>(
    schema: string,
    table: string,
    conditions: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(conditions).length === 0) {
        throw new Error('Get conditions cannot be empty');
      }

      const values: unknown[] = [];
      let paramIndex = 1;
      const whereClause = Object.keys(conditions)
        .map((key) => {
          this.validateColumnName(key);
          values.push(conditions[key]);
          return `"${key}" = $${paramIndex++}`;
        })
        .join(' AND ');

      let query = `SELECT * FROM "${schema}"."${table}" WHERE ${whereClause} LIMIT 1`;

      if (options?.offset !== undefined) {
        query += ` OFFSET $${paramIndex}`;
        values.push(options.offset);
      }

      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);

      return result.rows.length > 0 ? result.rows[0] as T : null;
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to get record from ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  async list<T = unknown>(
    schema: string,
    table: string,
    conditions: Record<string, unknown> = {},
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      let query = `SELECT * FROM "${schema}"."${table}"`;
      const values: unknown[] = [];
      let paramIndex = 1;

      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map((key) => {
            this.validateColumnName(key);
            values.push(conditions[key]);
            return `"${key}" = $${paramIndex++}`;
          })
          .join(' AND ');
        query += ` WHERE ${whereClause}`;
      }

      if (options?.limit !== undefined) {
        query += ` LIMIT $${paramIndex++}`;
        values.push(options.limit);
      }
      if (options?.offset !== undefined) {
        query += ` OFFSET $${paramIndex++}`;
        values.push(options.offset);
      }

      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);
      return result.rows as T[];
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to list records from ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  async count(schema: string, table: string, conditions: Record<string, unknown> = {}): Promise<number> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      let query = `SELECT COUNT(*) as count FROM "${schema}"."${table}"`;
      const values: unknown[] = [];
      let paramIndex = 1;

      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map((key) => {
            this.validateColumnName(key);
            values.push(conditions[key]);
            return `"${key}" = $${paramIndex++}`;
          })
          .join(' AND ');
        query += ` WHERE ${whereClause}`;
      }

      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to count records in ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  async insert(schema: string, table: string, data: Record<string, unknown>): Promise<MutationResult> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(data).length === 0) {
        throw new Error('Insert data cannot be empty');
      }

      const columns = Object.keys(data);
      columns.forEach((col) => this.validateColumnName(col));

      const values = Object.values(data);
      let paramIndex = 1;
      const placeholders = values.map(() => `$${paramIndex++}`).join(', ');
      const columnNames = columns.map((col) => `"${col}"`).join(', ');

      const query = `INSERT INTO "${schema}"."${table}" (${columnNames}) VALUES (${placeholders}) RETURNING *`;
      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);

      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id,
        rows: result.rows,
      };
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to insert record into ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  async upsert(
    schema: string,
    table: string,
    data: Record<string, unknown>,
    conflictColumns: string[]
  ): Promise<MutationResult> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(data).length === 0) throw new Error('Upsert data cannot be empty');
      if (conflictColumns.length === 0) throw new Error('Upsert conflictColumns cannot be empty');

      const columns = Object.keys(data);
      columns.forEach(col => this.validateColumnName(col));
      conflictColumns.forEach(col => this.validateColumnName(col));

      const values = Object.values(data);
      let paramIndex = 1;
      const placeholders = values.map(() => `$${paramIndex++}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');
      const conflictTarget = conflictColumns.map(col => `"${col}"`).join(', ');
      const updateClause = columns
        .filter(col => !conflictColumns.includes(col))
        .map(col => `"${col}" = EXCLUDED."${col}"`)
        .join(', ');

      const conflictAction = updateClause ? `DO UPDATE SET ${updateClause}` : 'DO NOTHING';

      const query = `INSERT INTO "${schema}"."${table}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) ${conflictAction} RETURNING *`;
      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);

      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id,
        rows: result.rows,
      };
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to upsert record into ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  async update(
    schema: string,
    table: string,
    data: Record<string, unknown>,
    conditions: Record<string, unknown>
  ): Promise<MutationResult> {
    let query = '';
    const values: unknown[] = [];

    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(data).length === 0) {
        throw new Error('Update data cannot be empty');
      }

      if (Object.keys(conditions).length === 0) {
        throw new Error('Update conditions cannot be empty - this prevents accidental full table updates');
      }

      let paramIndex = 1;

      const setClause = Object.keys(data)
        .map((key) => {
          this.validateColumnName(key);
          values.push(data[key]);
          return `"${key}" = $${paramIndex++}`;
        })
        .join(', ');

      const whereClause = Object.keys(conditions)
        .map((key) => {
          this.validateColumnName(key);
          values.push(conditions[key]);
          return `"${key}" = $${paramIndex++}`;
        })
        .join(' AND ');

      query = `UPDATE "${schema}"."${table}" SET ${setClause} WHERE ${whereClause} RETURNING *`;
      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);

      return {
        affectedRows: result.rowCount || 0,
        changedRows: result.rowCount || 0,
        rows: result.rows,
      };
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to update records in ${schema}.${table}: ${this.getErrorMessage(error)}\nQuery: ${query}\nValues: ${JSON.stringify(values)}`);
    }
  }

  async delete(schema: string, table: string, conditions: Record<string, unknown>): Promise<MutationResult> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(conditions).length === 0) {
        throw new Error('Delete conditions cannot be empty - this prevents accidental full table deletion');
      }

      const values: unknown[] = [];
      let paramIndex = 1;

      const whereClause = Object.keys(conditions)
        .map((key) => {
          this.validateColumnName(key);
          values.push(conditions[key]);
          return `"${key}" = $${paramIndex++}`;
        })
        .join(' AND ');

      const query = `DELETE FROM "${schema}"."${table}" WHERE ${whereClause}`;
      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);

      return {
        affectedRows: result.rowCount || 0,
      };
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to delete records from ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const client = this.transactionClient || this.pool;
      const result = await client.query(sql, params);
      return result.rows as T[];
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Query execution failed: ${this.getErrorMessage(error)}`);
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<MutationResult> {
    try {
      const client = this.transactionClient || this.pool;
      const result = await client.query(sql, params);
      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id,
        rows: result.rows,
      };
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Execute operation failed: ${this.getErrorMessage(error)}`);
    }
  }

  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const transactionalDb = Object.create(DatabaseService.prototype) as DatabaseService;
      (transactionalDb as unknown as { pool: Pool; transactionClient: PoolClient }).pool = this.pool;
      (transactionalDb as unknown as { pool: Pool; transactionClient: PoolClient }).transactionClient = client;

      const result = await callback(transactionalDb);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Transaction failed: ${this.getErrorMessage(error)}`);
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    let client: PoolClient | undefined;
    try {
      client = await this.pool.connect();
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      throw new Error(`Database connection test failed: ${this.getErrorMessage(error)}`);
    } finally {
      if (client) client.release();
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      throw new Error(`Failed to close database pool: ${this.getErrorMessage(error)}`);
    }
  }

  private validateTableName(table: string): void {
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
  }

  private validateColumnName(column: string): void {
    if (!/^[a-zA-Z0-9_]+$/.test(column)) {
      throw new Error(`Invalid column name: ${column}`);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
