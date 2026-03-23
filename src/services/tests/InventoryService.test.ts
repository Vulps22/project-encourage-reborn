import { DatabaseService } from '../DatabaseService';
import { InventoryService } from '../InventoryService';
import { InventoryItem } from '../../interface';
import { Storable } from '../../types';

jest.mock('../DatabaseService');

const makeInventoryItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: 1,
    user_id: '123',
    storable_id: Storable.Skip,
    qty: 0,
    ...overrides,
});

describe('InventoryService', () => {
    let service: InventoryService;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        mockDb = new DatabaseService({
            host: 'localhost',
            user: 'test',
            password: 'test',
            database: 'test',
        }) as jest.Mocked<DatabaseService>;

        service = new InventoryService(mockDb);
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('should return the inventory item when it exists', async () => {
            const item = makeInventoryItem({ qty: 3 });
            (mockDb.get as jest.Mock).mockResolvedValue(item);

            const result = await service.get('123', Storable.Skip);

            expect(mockDb.get).toHaveBeenCalledWith('user', 'inventory', {
                user_id: '123',
                storable_id: Storable.Skip,
            });
            expect(result).toEqual(item);
        });

        it('should return null when no row exists', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            const result = await service.get('123', Storable.Skip);

            expect(result).toBeNull();
        });
    });

    describe('add', () => {
        it('should upsert and return the inventory item', async () => {
            const item = makeInventoryItem({ qty: 1 });
            (mockDb.execute as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [item] });

            const result = await service.add('123', Storable.Skip, 1);

            expect(mockDb.execute).toHaveBeenCalledWith(
                expect.stringContaining('ON CONFLICT'),
                ['123', Storable.Skip, 1]
            );
            expect(result).toEqual(item);
        });

        it('should accumulate qty on subsequent adds', async () => {
            const item = makeInventoryItem({ qty: 6 });
            (mockDb.execute as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [item] });

            const result = await service.add('123', Storable.Skip, 5);

            expect(result.qty).toBe(6);
        });
    });

    describe('consume', () => {
        it('should decrement qty and return the updated item', async () => {
            const item = makeInventoryItem({ qty: 2 });
            (mockDb.execute as jest.Mock).mockResolvedValue({ affectedRows: 1, rows: [item] });

            const result = await service.consume('123', Storable.Skip, 1);

            expect(mockDb.execute).toHaveBeenCalledWith(
                expect.stringContaining('qty" - $1'),
                [1, '123', Storable.Skip]
            );
            expect(result).toEqual(item);
        });

        it('should return false when no inventory row exists', async () => {
            (mockDb.execute as jest.Mock).mockResolvedValue({ affectedRows: 0, rows: [] });

            await expect(service.consume('123', Storable.Skip, 1)).resolves.toBe(false);
        });
    });
});
