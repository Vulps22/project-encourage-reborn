/* eslint-disable */
import { Pool, PoolClient } from 'pg';

/**
 * Database query result for SELECT operations
 * @deprecated - use DatabaseClient
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number | null;
}

/**
 * Database mutation result for INSERT, UPDATE, DELETE operations
 * @deprecated - use DatabaseClient
 */
export interface MutationResult {
  affectedRows: number;
  insertId?: number;
  changedRows?: number;
  rows?: any[];
}

/**
 * Database connection pool configuration
 * @deprecated - use DatabaseClient
 */
export interface DatabaseConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  waitForConnections?: boolean;
  queueLimit?: number;
}

/**
 * Query options for list and get operations
 * @deprecated - use DatabaseClient
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
}

/**
 * Transaction callback function type
 * @deprecated - use DatabaseClient
 */
export type TransactionCallback<T> = (db: DatabaseService) => Promise<T>;

/**
 * DatabaseService - Centralized database operations handler
 * * Provides a consistent interface for all database operations with:
 * - Connection pooling for optimal performance
 * - Parameterized queries for SQL injection prevention
 * - Comprehensive error handling
 * - TypeScript type safety
 * - Transaction support
 * * @deprecated - use DatabaseClient
 */
export class DatabaseService {
  private pool: Pool;
  private transactionClient?: PoolClient;

  /**
   * Creates a new DatabaseService instance
   * @param config Database configuration options
   * @deprecated - use DatabaseClient
   */
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

  /**
   * Get a single record matching conditions
   * @param schema Schema name
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @param options Query options (offset for pagination)
   * @returns Single record or null if not found
   * @deprecated - use DatabaseClient
   */
  async get<T = any>(
    schema: string,
    table: string,
    conditions: Record<string, any>,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(conditions).length === 0) {
        throw new Error('Get conditions cannot be empty');
      }

      const values: any[] = [];
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
      throw new Error(`Failed to get record from ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * List records with optional filtering
   * @param schema Schema name
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @param options Query options (limit, offset)
   * @returns Array of records
   * @deprecated - use DatabaseClient
   */
  async list<T = any>(
    schema: string,
    table: string,
    conditions: Record<string, any> = {},
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      let query = `SELECT * FROM "${schema}"."${table}"`;
      const values: any[] = [];
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
      throw new Error(`Failed to list records from ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Count records with optional filtering
   * @param schema Schema name
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @returns Number of matching records
   * @deprecated - use DatabaseClient
   */
  async count(schema: string, table: string, conditions: Record<string, any> = {}): Promise<number> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      let query = `SELECT COUNT(*) as count FROM "${schema}"."${table}"`;
      const values: any[] = [];
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
      throw new Error(`Failed to count records in ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Insert a new record
   * @param schema Schema name
   * @param table Table name
   * @param data Record data as key-value pairs
   * @returns Mutation result with insertId
   * @deprecated - use DatabaseClient
   */
  async insert(schema: string, table: string, data: Record<string, any>): Promise<MutationResult> {
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
      throw new Error(`Failed to insert record into ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Upsert a record — insert or update on conflict
   * @param schema Schema name
   * @param table Table name
   * @param data Record data as key-value pairs
   * @param conflictColumns Columns that define uniqueness (ON CONFLICT target)
   * @returns Mutation result
   * @deprecated - use DatabaseClient
   */
  async upsert(
    schema: string,
    table: string,
    data: Record<string, any>,
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

      const query = `INSERT INTO "${schema}"."${table}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateClause} RETURNING *`;
      const client = this.transactionClient || this.pool;
      const result = await client.query(query, values);

      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id,
        rows: result.rows,
      };
    } catch (error) {
      throw new Error(`Failed to upsert record into ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Update records
   * @deprecated - use DatabaseClient
   */
  async update(
    schema: string,
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<MutationResult> {
    let query = '';
    const values: any[] = [];

    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(data).length === 0) throw new Error('Update data cannot be empty');
      if (Object.keys(conditions).length === 0) throw new Error('Update conditions cannot be empty');

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
      throw new Error(`Failed to update records in ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Delete records
   * @param schema Schema name
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @returns Mutation result with affectedRows
   * @deprecated - use DatabaseClient
   */
  async delete(schema: string, table: string, conditions: Record<string, any>): Promise<MutationResult> {
    try {
      this.validateTableName(schema);
      this.validateTableName(table);

      if (Object.keys(conditions).length === 0) {
        throw new Error('Delete conditions cannot be empty');
      }

      const values: any[] = [];
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
      throw new Error(`Failed to delete records from ${schema}.${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Execute a custom SELECT query with parameters
   * @param sql SQL query string
   * @param params Query parameters
   * @deprecated - use DatabaseClient
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const client = this.transactionClient || this.pool;
      const result = await client.query(sql, params);
      return result.rows as T[];
    } catch (error) {
      throw new Error(`Query execution failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Execute a custom mutation query
   * @param sql SQL query string
   * @param params Query parameters
   * @deprecated - use DatabaseClient
   */
  async execute(sql: string, params: any[] = []): Promise<MutationResult> {
    try {
      const client = this.transactionClient || this.pool;
      const result = await client.query(sql, params);
      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id,
        rows: result.rows,
      };
    } catch (error) {
      throw new Error(`Execute operation failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Execute multiple operations within a transaction
   * @param callback Function containing transaction operations
   * @deprecated - use DatabaseClient
   */
  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const transactionalDb = Object.create(DatabaseService.prototype);
      transactionalDb.pool = this.pool;
      transactionalDb.transactionClient = client;
      
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

  /**
   * Test database connection
   * @deprecated - use DatabaseClient
   */
  async testConnection(): Promise<boolean> {
    let client;
    try {
      client = await this.pool.connect();
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      throw new Error(`Database connection test failed: ${this.getErrorMessage(error)}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Close the connection pool
   * @deprecated - use DatabaseClient
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      throw new Error(`Failed to close database pool: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * @deprecated - use DatabaseClient
   */
  private validateTableName(table: string): void {
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
  }

  /**
   * @deprecated - use DatabaseClient
   */
  private validateColumnName(column: string): void {
    if (!/^[a-zA-Z0-9_]+$/.test(column)) {
      throw new Error(`Invalid column name: ${column}`);
    }
  }

  /**
   * @deprecated - use DatabaseClient
   */
  private getErrorMessage(error: unknown): string {
    console.log('Error details:', error);
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}