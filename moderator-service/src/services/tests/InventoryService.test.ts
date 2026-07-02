import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { InventoryService } from '../InventoryService';
import { InventoryItem } from '@vulps22/project-encourage-types';
import { Storable } from '../../bot/types';

jest.mock('../../bot/services/DatabaseClient');

// The @vulps22/project-encourage-types package types `InventoryItem.storable_id` as the
// package's own `Storable` interface ({ id, name }), but the local `bot/types/Storable`
// enum is what's actually used across MS to identify a storable by its string id at
// runtime. Cast to bridge the two here.
const makeInventoryItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 1,
  user_id: '123',
  storable_id: Storable.Skip as unknown as InventoryItem['storable_id'],
  qty: 0,
  ...overrides,
});

describe('InventoryService', () => {
  let service: InventoryService;
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getInventoryItem: jest.fn(),
      addInventoryItem: jest.fn(),
      consumeInventoryItem: jest.fn(),
    } as any;

    service = new InventoryService(mockDb);
  });

  describe('get', () => {
    it('should return the inventory item when it exists', async () => {
      const item = makeInventoryItem({ qty: 3 });
      mockDb.getInventoryItem.mockResolvedValue(item);

      const result = await service.get('123', Storable.Skip);

      expect(mockDb.getInventoryItem).toHaveBeenCalledWith('123', Storable.Skip);
      expect(result).toEqual(item);
    });

    it('should return null when no row exists', async () => {
      mockDb.getInventoryItem.mockResolvedValue(null);

      const result = await service.get('123', Storable.Skip);

      expect(result).toBeNull();
    });
  });

  describe('add', () => {
    it('should add inventory item via DS and return the result', async () => {
      const item = makeInventoryItem({ qty: 1 });
      mockDb.addInventoryItem.mockResolvedValue(item);

      const result = await service.add('123', Storable.Skip, 1);

      expect(mockDb.addInventoryItem).toHaveBeenCalledWith('123', Storable.Skip, 1);
      expect(result).toEqual(item);
    });

    it('should accumulate qty on subsequent adds', async () => {
      const item = makeInventoryItem({ qty: 6 });
      mockDb.addInventoryItem.mockResolvedValue(item);

      const result = await service.add('123', Storable.Skip, 5);

      expect(result.qty).toBe(6);
    });
  });

  describe('consume', () => {
    it('should consume inventory item via DS and return the result', async () => {
      const item = makeInventoryItem({ qty: 2 });
      mockDb.consumeInventoryItem.mockResolvedValue(item);

      const result = await service.consume('123', Storable.Skip, 1);

      expect(mockDb.consumeInventoryItem).toHaveBeenCalledWith('123', Storable.Skip, 1);
      expect(result).toEqual(item);
    });

    it('should return false when insufficient quantity', async () => {
      mockDb.consumeInventoryItem.mockResolvedValue(false);

      const result = await service.consume('123', Storable.Skip, 1);

      expect(result).toBe(false);
    });
  });
});
