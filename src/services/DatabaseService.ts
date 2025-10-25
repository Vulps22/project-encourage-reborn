import mysql from 'mysql2/promise';

/**
 * Database query result for SELECT operations
 */
export interface QueryResult<T = any> {
  rows: T[];
  fields: mysql.FieldPacket[];
}

/**
 * Database mutation result for INSERT, UPDATE, DELETE operations
 */
export interface MutationResult {
  affectedRows: number;
  insertId?: number;
  changedRows?: number;
}

/**
 * Database connection pool configuration
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
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
}

/**
 * Transaction callback function type
 */
export type TransactionCallback<T> = (db: DatabaseService) => Promise<T>;

/**
 * DatabaseService - Centralized database operations handler
 * 
 * Provides a consistent interface for all database operations with:
 * - Connection pooling for optimal performance
 * - Parameterized queries for SQL injection prevention
 * - Comprehensive error handling
 * - TypeScript type safety
 * - Transaction support
 */
export class DatabaseService {
  private pool: mysql.Pool;
  private transactionConnection?: mysql.PoolConnection;

  /**
   * Creates a new DatabaseService instance
   * @param config Database configuration options
   */
  constructor(config: DatabaseConfig) {
    try {
      this.pool = mysql.createPool({
        host: config.host,
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionLimit: config.connectionLimit || 10,
        waitForConnections: config.waitForConnections ?? true,
        queueLimit: config.queueLimit || 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
    } catch (error) {
      throw new Error(`Failed to create database pool: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get a single record matching conditions
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @param options Query options (offset for pagination)
   * @returns Single record or null if not found
   */
  async get<T = any>(
    table: string,
    conditions: Record<string, any>,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      this.validateTableName(table);

      if (Object.keys(conditions).length === 0) {
        throw new Error('Get conditions cannot be empty');
      }

      const values: any[] = [];
      const whereClause = Object.keys(conditions)
        .map((key) => {
          this.validateColumnName(key);
          values.push(conditions[key]);
          return `\`${key}\` = ?`;
        })
        .join(' AND ');

      let query = `SELECT * FROM \`${table}\` WHERE ${whereClause} LIMIT 1`;

      if (options?.offset !== undefined) {
        query += ` OFFSET ?`;
        values.push(options.offset);
      }

      const connection = this.transactionConnection || this.pool;
      const [rows] = await connection.execute(query, values) as [any[], mysql.FieldPacket[]];

      return rows.length > 0 ? rows[0] as T : null;
    } catch (error) {
      throw new Error(`Failed to get record from ${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * List records with optional filtering
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @param options Query options (limit, offset)
   * @returns Array of records
   */
  async list<T = any>(
    table: string,
    conditions: Record<string, any> = {},
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      this.validateTableName(table);

      let query = `SELECT * FROM \`${table}\``;
      const values: any[] = [];

      // Add WHERE clause if conditions provided
      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map((key) => {
            this.validateColumnName(key);
            values.push(conditions[key]);
            return `\`${key}\` = ?`;
          })
          .join(' AND ');
        query += ` WHERE ${whereClause}`;
      }

      // Add LIMIT and OFFSET
      if (options?.limit !== undefined) {
        query += ` LIMIT ?`;
        values.push(options.limit);
      }
      if (options?.offset !== undefined) {
        query += ` OFFSET ?`;
        values.push(options.offset);
      }

      const connection = this.transactionConnection || this.pool;
      const [rows] = await connection.execute(query, values) as [any[], mysql.FieldPacket[]];
      return rows as T[];
    } catch (error) {
      throw new Error(`Failed to list records from ${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Count records with optional filtering
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @returns Number of matching records
   */
  async count(table: string, conditions: Record<string, any> = {}): Promise<number> {
    try {
      this.validateTableName(table);

      let query = `SELECT COUNT(*) as count FROM \`${table}\``;
      const values: any[] = [];

      // Add WHERE clause if conditions provided
      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions)
          .map((key) => {
            this.validateColumnName(key);
            values.push(conditions[key]);
            return `\`${key}\` = ?`;
          })
          .join(' AND ');
        query += ` WHERE ${whereClause}`;
      }

      const connection = this.transactionConnection || this.pool;
      const [rows] = await connection.execute(query, values) as [any[], mysql.FieldPacket[]];
      return (rows[0] as any).count;
    } catch (error) {
      throw new Error(`Failed to count records in ${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Insert a new record
   * @param table Table name
   * @param data Record data as key-value pairs
   * @returns Mutation result with insertId
   */
  async insert(table: string, data: Record<string, any>): Promise<MutationResult> {
    try {
      this.validateTableName(table);

      if (Object.keys(data).length === 0) {
        throw new Error('Insert data cannot be empty');
      }

      const columns = Object.keys(data);
      columns.forEach((col) => this.validateColumnName(col));

      const values = Object.values(data);
      const placeholders = values.map(() => '?').join(', ');
      const columnNames = columns.map((col) => `\`${col}\``).join(', ');

      const query = `INSERT INTO \`${table}\` (${columnNames}) VALUES (${placeholders})`;
      const connection = this.transactionConnection || this.pool;
      const [result] = await connection.execute(query, values) as [mysql.ResultSetHeader, mysql.FieldPacket[]];

      return {
        affectedRows: result.affectedRows,
        insertId: result.insertId,
      };
    } catch (error) {
      throw new Error(`Failed to insert record into ${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Update existing records
   * @param table Table name
   * @param data Updated data as key-value pairs
   * @param conditions WHERE conditions as key-value pairs
   * @returns Mutation result with affectedRows and changedRows
   */
  async update(
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<MutationResult> {
    try {
      this.validateTableName(table);

      if (Object.keys(data).length === 0) {
        throw new Error('Update data cannot be empty');
      }

      if (Object.keys(conditions).length === 0) {
        throw new Error('Update conditions cannot be empty - this prevents accidental full table updates');
      }

      const values: any[] = [];

      // Build SET clause
      const setClause = Object.keys(data)
        .map((key) => {
          this.validateColumnName(key);
          values.push(data[key]);
          return `\`${key}\` = ?`;
        })
        .join(', ');

      // Build WHERE clause
      const whereClause = Object.keys(conditions)
        .map((key) => {
          this.validateColumnName(key);
          values.push(conditions[key]);
          return `\`${key}\` = ?`;
        })
        .join(' AND ');

      const query = `UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`;
      const connection = this.transactionConnection || this.pool;
      const [result] = await connection.execute(query, values) as [mysql.ResultSetHeader, mysql.FieldPacket[]];

      return {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows,
      };
    } catch (error) {
      throw new Error(`Failed to update records in ${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Delete records
   * @param table Table name
   * @param conditions WHERE conditions as key-value pairs
   * @returns Mutation result with affectedRows
   */
  async delete(table: string, conditions: Record<string, any>): Promise<MutationResult> {
    try {
      this.validateTableName(table);

      if (Object.keys(conditions).length === 0) {
        throw new Error('Delete conditions cannot be empty - this prevents accidental full table deletion');
      }

      const values: any[] = [];

      // Build WHERE clause
      const whereClause = Object.keys(conditions)
        .map((key) => {
          this.validateColumnName(key);
          values.push(conditions[key]);
          return `\`${key}\` = ?`;
        })
        .join(' AND ');

      const query = `DELETE FROM \`${table}\` WHERE ${whereClause}`;
      const connection = this.transactionConnection || this.pool;
      const [result] = await connection.execute(query, values) as [mysql.ResultSetHeader, mysql.FieldPacket[]];

      return {
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      throw new Error(`Failed to delete records from ${table}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Execute a custom SELECT query with parameters
   * @param sql SQL query string with ? placeholders
   * @param params Query parameters
   * @returns Array of result rows
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const connection = this.transactionConnection || this.pool;
      const [rows] = await connection.execute(sql, params) as [any[], mysql.FieldPacket[]];
      return rows as T[];
    } catch (error) {
      throw new Error(`Query execution failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Execute a custom mutation query (INSERT, UPDATE, DELETE) with parameters
   * @param sql SQL query string with ? placeholders
   * @param params Query parameters
   * @returns Mutation result
   */
  async execute(sql: string, params: any[] = []): Promise<MutationResult> {
    try {
      const connection = this.transactionConnection || this.pool;
      const [result] = await connection.execute(sql, params) as [mysql.ResultSetHeader, mysql.FieldPacket[]];
      return {
        affectedRows: result.affectedRows,
        insertId: result.insertId,
        changedRows: result.changedRows,
      };
    } catch (error) {
      throw new Error(`Execute operation failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Execute multiple operations within a transaction
   * @param callback Function containing transaction operations
   * @returns Result from the callback function
   */
  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Create a new DatabaseService instance with transaction connection
      const transactionalDb = Object.create(DatabaseService.prototype);
      transactionalDb.pool = this.pool;
      transactionalDb.transactionConnection = connection;
      
      const result = await callback(transactionalDb);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Transaction failed: ${this.getErrorMessage(error)}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Close the connection pool
   * Call this when shutting down the application
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      throw new Error(`Failed to close database pool: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Validate table name to prevent SQL injection
   * @param table Table name
   */
  private validateTableName(table: string): void {
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
  }

  /**
   * Validate column name to prevent SQL injection
   * @param column Column name
   */
  private validateColumnName(column: string): void {
    if (!/^[a-zA-Z0-9_]+$/.test(column)) {
      throw new Error(`Invalid column name: ${column}`);
    }
  }

  /**
   * Extract error message from unknown error type
   * @param error Error object
   * @returns Error message string
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}