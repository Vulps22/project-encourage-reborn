import { DatabaseService } from '../DatabaseService';
import { Pool } from 'pg';

// Mock pg
jest.mock('pg');

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Mock pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Pool constructor
    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPool);

    // Create instance
    dbService = new DatabaseService({
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'testdb',
    });
  });

  describe('constructor', () => {
    it('should create a connection pool with default values', () => {
      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        user: 'test',
        password: 'test',
        database: 'testdb',
        max: 10,
      });
    });

    it('should create a connection pool with custom values', () => {
      new DatabaseService({
        host: 'remote',
        port: 3307,
        user: 'admin',
        password: 'secret',
        database: 'production',
        connectionLimit: 20,
      });

      expect(Pool).toHaveBeenCalledWith({
        host: 'remote',
        port: 3307,
        user: 'admin',
        password: 'secret',
        database: 'production',
        max: 20,
      });
    });

    it('should throw error if pool creation fails', () => {
      (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      expect(() => {
        new DatabaseService({
          host: 'localhost',
          user: 'test',
          password: 'test',
          database: 'testdb',
        });
      }).toThrow('Failed to create database pool: Connection failed');
    });
  });

  describe('get', () => {
    it('should retrieve a single record by conditions', async () => {
      const mockRow = { id: 1, name: 'Test User', email: 'test@example.com' };
      mockPool.query.mockResolvedValue({ rows: [mockRow], rowCount: 1 });

      const result = await dbService.get('core', 'users', { id: 1 });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM "core"."users" WHERE "id" = $1 LIMIT 1',
        [1]
      );
      expect(result).toEqual(mockRow);
    });

    it('should return null if no record found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await dbService.get('core', 'users', { id: 999 });

      expect(result).toBeNull();
    });

    it('should use multiple conditions', async () => {
      const mockRow = { uuid: 'abc-123', name: 'Test', status: 'active' };
      mockPool.query.mockResolvedValue({ rows: [mockRow], rowCount: 1 });

      await dbService.get('core', 'users', { uuid: 'abc-123', status: 'active' });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM "core"."users" WHERE "uuid" = $1 AND "status" = $2 LIMIT 1',
        ['abc-123', 'active']
      );
    });

    it('should support offset option', async () => {
      const mockRow = { id: 2, name: 'Second User' };
      mockPool.query.mockResolvedValue({ rows: [mockRow], rowCount: 1 });

      await dbService.get('core', 'users', { status: 'active' }, { offset: 1 });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM "core"."users" WHERE "status" = $1 LIMIT 1 OFFSET $2',
        ['active', 1]
      );
    });

    it('should throw error on invalid table name', async () => {
      await expect(dbService.get('core', 'users; DROP TABLE users;--', { id: 1 })).rejects.toThrow(
        'Invalid table name'
      );
    });

    it('should throw error on invalid column name', async () => {
      await expect(dbService.get('core', 'users', { 'id; DROP TABLE users;--': 1 })).rejects.toThrow(
        'Invalid column name'
      );
    });

    it('should throw error for empty conditions', async () => {
      await expect(dbService.get('core', 'users', {})).rejects.toThrow(
        'Get conditions cannot be empty'
      );
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database connection lost'));

      await expect(dbService.get('core', 'users', { id: 1 })).rejects.toThrow(
        'Failed to get record from core.users: Database connection lost'
      );
    });
  });

  describe('list', () => {
    it('should list all records without conditions', async () => {
      const mockRows = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ];
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 2 });

      const result = await dbService.list('core', 'users');

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM "core"."users"', []);
      expect(result).toEqual(mockRows);
    });

    it('should list records with conditions', async () => {
      const mockRows = [{ id: 1, name: 'Active User', status: 'active' }];
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 1 });

      const result = await dbService.list('core', 'users', { status: 'active' });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM "core"."users" WHERE "status" = $1',
        ['active']
      );
      expect(result).toEqual(mockRows);
    });

    it('should list records with multiple conditions', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await dbService.list('core', 'users', { status: 'active', role: 'admin' });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM "core"."users" WHERE "status" = $1 AND "role" = $2',
        ['active', 'admin']
      );
    });

    it('should list records with limit', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await dbService.list('core', 'users', {}, { limit: 10 });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM "core"."users" LIMIT $1',
        [10]
      );
    });

    it('should list records with limit and offset', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await dbService.list('core', 'users', {}, { limit: 10, offset: 20 });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM "core"."users" LIMIT $1 OFFSET $2',
        [10, 20]
      );
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Query timeout'));

      await expect(dbService.list('core', 'users')).rejects.toThrow(
        'Failed to list records from core.users: Query timeout'
      );
    });
  });

  describe('count', () => {
    it('should count all records without conditions', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '42' }], rowCount: 1 });

      const result = await dbService.count('core', 'users');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM "core"."users"',
        []
      );
      expect(result).toBe(42);
    });

    it('should count records with conditions', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '5' }], rowCount: 1 });

      const result = await dbService.count('core', 'users', { status: 'active' });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM "core"."users" WHERE "status" = $1',
        ['active']
      );
      expect(result).toBe(5);
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Table not found'));

      await expect(dbService.count('core', 'users')).rejects.toThrow(
        'Failed to count records in core.users: Table not found'
      );
    });
  });

  describe('insert', () => {
    it('should insert a new record', async () => {
      const mockRows = [{ id: 123, name: 'New User', email: 'new@example.com' }];
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 1 });

      const result = await dbService.insert('core', 'users', {
        name: 'New User',
        email: 'new@example.com',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO "core"."users" ("name", "email") VALUES ($1, $2) RETURNING *',
        ['New User', 'new@example.com']
      );
      expect(result).toEqual({
        affectedRows: 1,
        insertId: 123,
        rows: mockRows,
      });
    });

    it('should throw error for empty data', async () => {
      await expect(dbService.insert('core', 'users', {})).rejects.toThrow(
        'Insert data cannot be empty'
      );
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Duplicate entry'));

      await expect(
        dbService.insert('core', 'users', { email: 'duplicate@example.com' })
      ).rejects.toThrow('Failed to insert record into core.users: Duplicate entry');
    });
  });

  describe('update', () => {
    it('should update records', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await dbService.update(
        'core',
        'users',
        { name: 'Updated Name' },
        { id: 1 }
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE "core"."users" SET "name" = $1 WHERE "id" = $2',
        ['Updated Name', 1]
      );
      expect(result).toEqual({
        affectedRows: 1,
        changedRows: 1,
      });
    });

    it('should update multiple fields', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 1 });

      await dbService.update(
        'core',
        'users',
        { name: 'New Name', email: 'new@example.com' },
        { id: 1 }
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE "core"."users" SET "name" = $1, "email" = $2 WHERE "id" = $3',
        ['New Name', 'new@example.com', 1]
      );
    });

    it('should throw error for empty data', async () => {
      await expect(dbService.update('core', 'users', {}, { id: 1 })).rejects.toThrow(
        'Update data cannot be empty'
      );
    });

    it('should throw error for empty conditions', async () => {
      await expect(
        dbService.update('core', 'users', { name: 'Test' }, {})
      ).rejects.toThrow('Update conditions cannot be empty');
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Lock timeout'));

      await expect(
        dbService.update('core', 'users', { name: 'Test' }, { id: 1 })
      ).rejects.toThrow('Failed to update records in core.users: Lock timeout');
    });
  });

  describe('delete', () => {
    it('should delete records', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await dbService.delete('core', 'users', { id: 1 });

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM "core"."users" WHERE "id" = $1',
        [1]
      );
      expect(result).toEqual({ affectedRows: 1 });
    });

    it('should delete with multiple conditions', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 2 });

      await dbService.delete('core', 'users', { status: 'inactive', verified: false });

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM "core"."users" WHERE "status" = $1 AND "verified" = $2',
        ['inactive', false]
      );
    });

    it('should throw error for empty conditions', async () => {
      await expect(dbService.delete('core', 'users', {})).rejects.toThrow(
        'Delete conditions cannot be empty'
      );
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(dbService.delete('core', 'users', { id: 1 })).rejects.toThrow(
        'Failed to delete records from core.users: Foreign key constraint'
      );
    });
  });

  describe('query', () => {
    it('should execute custom SELECT query', async () => {
      const mockRows = [{ id: 1, total: 100 }];
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 1 });

      const result = await dbService.query(
        'SELECT id, SUM(amount) as total FROM orders WHERE user_id = $1 GROUP BY id',
        [42]
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT id, SUM(amount) as total FROM orders WHERE user_id = $1 GROUP BY id',
        [42]
      );
      expect(result).toEqual(mockRows);
    });

    it('should execute query without parameters', async () => {
      const mockRows = [{ now: '2025-10-25' }];
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 1 });

      const result = await dbService.query('SELECT NOW() as now');

      expect(mockPool.query).toHaveBeenCalledWith('SELECT NOW() as now', []);
      expect(result).toEqual(mockRows);
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Syntax error'));

      await expect(dbService.query('INVALID SQL')).rejects.toThrow(
        'Query execution failed: Syntax error'
      );
    });
  });

  describe('execute', () => {
    it('should execute custom mutation query', async () => {
      const mockRows = [{ id: 1 }];
      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 2 });

      const result = await dbService.execute(
        'UPDATE users SET status = $1 WHERE last_login < $2',
        ['inactive', '2025-01-01']
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE users SET status = $1 WHERE last_login < $2',
        ['inactive', '2025-01-01']
      );
      expect(result).toEqual({
        affectedRows: 2,
        insertId: 1,
        rows: mockRows,
      });
    });

    it('should execute mutation without parameters', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await dbService.execute('DELETE FROM temp_table WHERE created_at < NOW()');

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM temp_table WHERE created_at < NOW()',
        []
      );
      expect(result).toEqual({
        affectedRows: 0,
        insertId: undefined,
        rows: [],
      });
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Constraint violation'));

      await expect(dbService.execute('UPDATE invalid')).rejects.toThrow(
        'Execute operation failed: Constraint violation'
      );
    });
  });

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      const mockRows = [{ id: 42, name: 'Test' }];
      mockClient.query.mockResolvedValue({ rows: mockRows, rowCount: 1 });

      const result = await dbService.transaction(async (db) => {
        await db.insert('core', 'users', { name: 'Test' });
        return 'success';
      });

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO "core"."users" ("name") VALUES ($1) RETURNING *',
        ['Test']
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should use transaction connection for nested operations', async () => {
      const mockRows = [{ id: 1, name: 'User 1' }];
      mockClient.query.mockResolvedValue({ rows: mockRows, rowCount: 1 });

      await dbService.transaction(async (db) => {
        const users = await db.list('core', 'users', { status: 'active' });
        expect(users).toEqual(mockRows);
      });

      // Should use client.query, not pool.query
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Transaction error'));

      await expect(dbService.transaction(callback)).rejects.toThrow(
        'Transaction failed: Transaction error'
      );

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
    });

    it('should release connection even if rollback fails', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Transaction error'));
      mockClient.query.mockImplementation((sql: string) => {
        if (sql === 'BEGIN') return Promise.resolve({ rows: [], rowCount: 0 });
        if (sql === 'ROLLBACK') return Promise.reject(new Error('Rollback failed'));
        return Promise.reject(new Error('Unknown query'));
      });

      await expect(dbService.transaction(callback)).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }], rowCount: 1 });

      const result = await dbService.testConnection();

      expect(result).toBe(true);
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error if connection fails', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(dbService.testConnection()).rejects.toThrow(
        'Database connection test failed: Connection failed'
      );
    });

    it('should throw error if query fails', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(dbService.testConnection()).rejects.toThrow(
        'Database connection test failed: Query failed'
      );
    });

    it('should release connection even if test fails', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      try {
        await dbService.testConnection();
      } catch {
        // Expected error
      }

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close the pool', async () => {
      await dbService.close();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle errors when closing', async () => {
      mockPool.end.mockRejectedValue(new Error('Close failed'));

      await expect(dbService.close()).rejects.toThrow(
        'Failed to close database pool: Close failed'
      );
    });
  });

  describe('validation', () => {
    it('should reject table names with special characters', async () => {
      await expect(dbService.get('core', 'users; DROP TABLE', { id: 1 })).rejects.toThrow(
        'Invalid table name'
      );
    });

    it('should reject column names with special characters', async () => {
      await expect(dbService.get('core', 'users', { 'id OR 1=1': 1 })).rejects.toThrow(
        'Invalid column name'
      );
    });

    it('should accept valid table and column names', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      // Should not throw
      await expect(
        dbService.get('core', 'valid_table_123', { valid_column_123: 1 })
      ).resolves.not.toThrow();
    });
  });
});
