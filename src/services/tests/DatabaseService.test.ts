import { DatabaseService } from '../DatabaseService';
import mysql from 'mysql2/promise';

// Mock mysql2/promise
jest.mock('mysql2/promise');

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockPool: any;
  let mockConnection: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock connection
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };

    // Mock pool
    mockPool = {
      execute: jest.fn(),
      getConnection: jest.fn().mockResolvedValue(mockConnection),
      end: jest.fn().mockResolvedValue(undefined),
    };

    // Mock createPool
    (mysql.createPool as jest.Mock).mockReturnValue(mockPool);

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
      expect(mysql.createPool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 3306,
        user: 'test',
        password: 'test',
        database: 'testdb',
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
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
        waitForConnections: false,
        queueLimit: 10,
      });

      expect(mysql.createPool).toHaveBeenCalledWith({
        host: 'remote',
        port: 3307,
        user: 'admin',
        password: 'secret',
        database: 'production',
        connectionLimit: 20,
        waitForConnections: false,
        queueLimit: 10,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
    });

    it('should throw error if pool creation fails', () => {
      (mysql.createPool as jest.Mock).mockImplementation(() => {
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
      mockPool.execute.mockResolvedValue([[mockRow], []]);

      const result = await dbService.get('users', { id: 1 });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM `users` WHERE `id` = ? LIMIT 1',
        [1]
      );
      expect(result).toEqual(mockRow);
    });

    it('should return null if no record found', async () => {
      mockPool.execute.mockResolvedValue([[], []]);

      const result = await dbService.get('users', { id: 999 });

      expect(result).toBeNull();
    });

    it('should use multiple conditions', async () => {
      const mockRow = { uuid: 'abc-123', name: 'Test', status: 'active' };
      mockPool.execute.mockResolvedValue([[mockRow], []]);

      await dbService.get('users', { uuid: 'abc-123', status: 'active' });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM `users` WHERE `uuid` = ? AND `status` = ? LIMIT 1',
        ['abc-123', 'active']
      );
    });

    it('should support offset option', async () => {
      const mockRow = { id: 2, name: 'Second User' };
      mockPool.execute.mockResolvedValue([[mockRow], []]);

      await dbService.get('users', { status: 'active' }, { offset: 1 });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM `users` WHERE `status` = ? LIMIT 1 OFFSET ?',
        ['active', 1]
      );
    });

    it('should throw error on invalid table name', async () => {
      await expect(dbService.get('users; DROP TABLE users;--', { id: 1 })).rejects.toThrow(
        'Invalid table name'
      );
    });

    it('should throw error on invalid column name', async () => {
      await expect(dbService.get('users', { 'id; DROP TABLE users;--': 1 })).rejects.toThrow(
        'Invalid column name'
      );
    });

    it('should throw error for empty conditions', async () => {
      await expect(dbService.get('users', {})).rejects.toThrow(
        'Get conditions cannot be empty'
      );
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database connection lost'));

      await expect(dbService.get('users', { id: 1 })).rejects.toThrow(
        'Failed to get record from users: Database connection lost'
      );
    });
  });

  describe('list', () => {
    it('should list all records without conditions', async () => {
      const mockRows = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ];
      mockPool.execute.mockResolvedValue([mockRows, []]);

      const result = await dbService.list('users');

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM `users`', []);
      expect(result).toEqual(mockRows);
    });

    it('should list records with conditions', async () => {
      const mockRows = [{ id: 1, name: 'Active User', status: 'active' }];
      mockPool.execute.mockResolvedValue([mockRows, []]);

      const result = await dbService.list('users', { status: 'active' });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM `users` WHERE `status` = ?',
        ['active']
      );
      expect(result).toEqual(mockRows);
    });

    it('should list records with multiple conditions', async () => {
      mockPool.execute.mockResolvedValue([[], []]);

      await dbService.list('users', { status: 'active', role: 'admin' });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM `users` WHERE `status` = ? AND `role` = ?',
        ['active', 'admin']
      );
    });

    it('should list records with limit', async () => {
      mockPool.execute.mockResolvedValue([[], []]);

      await dbService.list('users', {}, { limit: 10 });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM `users` LIMIT ?',
        [10]
      );
    });

    it('should list records with limit and offset', async () => {
      mockPool.execute.mockResolvedValue([[], []]);

      await dbService.list('users', {}, { limit: 10, offset: 20 });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM `users` LIMIT ? OFFSET ?',
        [10, 20]
      );
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Query timeout'));

      await expect(dbService.list('users')).rejects.toThrow(
        'Failed to list records from users: Query timeout'
      );
    });
  });

  describe('count', () => {
    it('should count all records without conditions', async () => {
      mockPool.execute.mockResolvedValue([[{ count: 42 }], []]);

      const result = await dbService.count('users');

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM `users`',
        []
      );
      expect(result).toBe(42);
    });

    it('should count records with conditions', async () => {
      mockPool.execute.mockResolvedValue([[{ count: 5 }], []]);

      const result = await dbService.count('users', { status: 'active' });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM `users` WHERE `status` = ?',
        ['active']
      );
      expect(result).toBe(5);
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Table not found'));

      await expect(dbService.count('users')).rejects.toThrow(
        'Failed to count records in users: Table not found'
      );
    });
  });

  describe('insert', () => {
    it('should insert a new record', async () => {
      const mockResult = { affectedRows: 1, insertId: 123 };
      mockPool.execute.mockResolvedValue([mockResult, []]);

      const result = await dbService.insert('users', {
        name: 'New User',
        email: 'new@example.com',
      });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'INSERT INTO `users` (`name`, `email`) VALUES (?, ?)',
        ['New User', 'new@example.com']
      );
      expect(result).toEqual({
        affectedRows: 1,
        insertId: 123,
      });
    });

    it('should throw error for empty data', async () => {
      await expect(dbService.insert('users', {})).rejects.toThrow(
        'Insert data cannot be empty'
      );
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Duplicate entry'));

      await expect(
        dbService.insert('users', { email: 'duplicate@example.com' })
      ).rejects.toThrow('Failed to insert record into users: Duplicate entry');
    });
  });

  describe('update', () => {
    it('should update records', async () => {
      const mockResult = { affectedRows: 1, changedRows: 1 };
      mockPool.execute.mockResolvedValue([mockResult, []]);

      const result = await dbService.update(
        'users',
        { name: 'Updated Name' },
        { id: 1 }
      );

      expect(mockPool.execute).toHaveBeenCalledWith(
        'UPDATE `users` SET `name` = ? WHERE `id` = ?',
        ['Updated Name', 1]
      );
      expect(result).toEqual({
        affectedRows: 1,
        changedRows: 1,
      });
    });

    it('should update multiple fields', async () => {
      const mockResult = { affectedRows: 1, changedRows: 1 };
      mockPool.execute.mockResolvedValue([mockResult, []]);

      await dbService.update(
        'users',
        { name: 'New Name', email: 'new@example.com' },
        { id: 1 }
      );

      expect(mockPool.execute).toHaveBeenCalledWith(
        'UPDATE `users` SET `name` = ?, `email` = ? WHERE `id` = ?',
        ['New Name', 'new@example.com', 1]
      );
    });

    it('should throw error for empty data', async () => {
      await expect(dbService.update('users', {}, { id: 1 })).rejects.toThrow(
        'Update data cannot be empty'
      );
    });

    it('should throw error for empty conditions', async () => {
      await expect(
        dbService.update('users', { name: 'Test' }, {})
      ).rejects.toThrow('Update conditions cannot be empty');
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Lock timeout'));

      await expect(
        dbService.update('users', { name: 'Test' }, { id: 1 })
      ).rejects.toThrow('Failed to update records in users: Lock timeout');
    });
  });

  describe('delete', () => {
    it('should delete records', async () => {
      const mockResult = { affectedRows: 1 };
      mockPool.execute.mockResolvedValue([mockResult, []]);

      const result = await dbService.delete('users', { id: 1 });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'DELETE FROM `users` WHERE `id` = ?',
        [1]
      );
      expect(result).toEqual({ affectedRows: 1 });
    });

    it('should delete with multiple conditions', async () => {
      const mockResult = { affectedRows: 2 };
      mockPool.execute.mockResolvedValue([mockResult, []]);

      await dbService.delete('users', { status: 'inactive', verified: false });

      expect(mockPool.execute).toHaveBeenCalledWith(
        'DELETE FROM `users` WHERE `status` = ? AND `verified` = ?',
        ['inactive', false]
      );
    });

    it('should throw error for empty conditions', async () => {
      await expect(dbService.delete('users', {})).rejects.toThrow(
        'Delete conditions cannot be empty'
      );
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(dbService.delete('users', { id: 1 })).rejects.toThrow(
        'Failed to delete records from users: Foreign key constraint'
      );
    });
  });

  describe('query', () => {
    it('should execute custom SELECT query', async () => {
      const mockRows = [{ id: 1, total: 100 }];
      const mockFields = [{ name: 'id' }, { name: 'total' }];
      mockPool.execute.mockResolvedValue([mockRows, mockFields]);

      const result = await dbService.query(
        'SELECT id, SUM(amount) as total FROM orders WHERE user_id = ? GROUP BY id',
        [42]
      );

      expect(mockPool.execute).toHaveBeenCalledWith(
        'SELECT id, SUM(amount) as total FROM orders WHERE user_id = ? GROUP BY id',
        [42]
      );
      expect(result).toEqual(mockRows);
    });

    it('should execute query without parameters', async () => {
      const mockRows = [{ now: '2025-10-25' }];
      mockPool.execute.mockResolvedValue([mockRows, []]);

      const result = await dbService.query('SELECT NOW() as now');

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT NOW() as now', []);
      expect(result).toEqual(mockRows);
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Syntax error'));

      await expect(dbService.query('INVALID SQL')).rejects.toThrow(
        'Query execution failed: Syntax error'
      );
    });
  });

  describe('execute', () => {
    it('should execute custom mutation query', async () => {
      const mockResult = { affectedRows: 2, insertId: 0, changedRows: 2 };
      mockPool.execute.mockResolvedValue([mockResult, []]);

      const result = await dbService.execute(
        'UPDATE users SET status = ? WHERE last_login < ?',
        ['inactive', '2025-01-01']
      );

      expect(mockPool.execute).toHaveBeenCalledWith(
        'UPDATE users SET status = ? WHERE last_login < ?',
        ['inactive', '2025-01-01']
      );
      expect(result).toEqual({
        affectedRows: 2,
        insertId: 0,
        changedRows: 2,
      });
    });

    it('should execute mutation without parameters', async () => {
      const mockResult = { affectedRows: 0, insertId: 0, changedRows: 0 };
      mockPool.execute.mockResolvedValue([mockResult, []]);

      const result = await dbService.execute('DELETE FROM temp_table WHERE created_at < NOW()');

      expect(mockPool.execute).toHaveBeenCalledWith(
        'DELETE FROM temp_table WHERE created_at < NOW()',
        []
      );
      expect(result).toEqual({
        affectedRows: 0,
        insertId: 0,
        changedRows: 0,
      });
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Constraint violation'));

      await expect(dbService.execute('UPDATE invalid')).rejects.toThrow(
        'Execute operation failed: Constraint violation'
      );
    });
  });

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      const mockInsertResult = { affectedRows: 1, insertId: 42 };
      mockConnection.execute.mockResolvedValue([mockInsertResult, []]);

      const result = await dbService.transaction(async (db) => {
        await db.insert('users', { name: 'Test' });
        return 'success';
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should use transaction connection for nested operations', async () => {
      const mockRows = [{ id: 1, name: 'User 1' }];
      mockConnection.execute.mockResolvedValue([mockRows, []]);

      await dbService.transaction(async (db) => {
        const users = await db.list('users', { status: 'active' });
        expect(users).toEqual(mockRows);
      });

      // Should use connection.execute, not pool.execute
      expect(mockConnection.execute).toHaveBeenCalled();
      expect(mockPool.execute).not.toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Transaction error'));

      await expect(dbService.transaction(callback)).rejects.toThrow(
        'Transaction failed: Transaction error'
      );

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it('should release connection even if rollback fails', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Transaction error'));
      mockConnection.rollback.mockRejectedValue(new Error('Rollback failed'));

      await expect(dbService.transaction(callback)).rejects.toThrow();

      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      mockConnection.ping = jest.fn().mockResolvedValue(undefined);

      const result = await dbService.testConnection();

      expect(result).toBe(true);
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.ping).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw error if connection fails', async () => {
      mockPool.getConnection.mockRejectedValue(new Error('Connection failed'));

      await expect(dbService.testConnection()).rejects.toThrow(
        'Database connection test failed: Connection failed'
      );
    });

    it('should throw error if ping fails', async () => {
      mockConnection.ping = jest.fn().mockRejectedValue(new Error('Ping failed'));

      await expect(dbService.testConnection()).rejects.toThrow(
        'Database connection test failed: Ping failed'
      );
    });

    it('should release connection even if test fails', async () => {
      mockConnection.ping = jest.fn().mockRejectedValue(new Error('Ping failed'));

      try {
        await dbService.testConnection();
      } catch {
        // Expected error
      }

      expect(mockConnection.release).toHaveBeenCalled();
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
      await expect(dbService.get('users; DROP TABLE', { id: 1 })).rejects.toThrow(
        'Invalid table name'
      );
    });

    it('should reject column names with special characters', async () => {
      await expect(dbService.get('users', { 'id OR 1=1': 1 })).rejects.toThrow(
        'Invalid column name'
      );
    });

    it('should accept valid table and column names', async () => {
      mockPool.execute.mockResolvedValue([[], []]);

      // Should not throw
      await expect(
        dbService.get('valid_table_123', { valid_column_123: 1 })
      ).resolves.not.toThrow();
    });
  });
});
