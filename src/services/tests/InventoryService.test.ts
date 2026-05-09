import { InventoryService } from '../InventoryService';
import { dsClient, DSError } from '../../client';
import { InventoryItem } from '../../interface';
import { Storable } from '../../types';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

const makeInventoryItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: 1,
    user_id: '123',
    storable_id: Storable.Skip,
    qty: 3,
    ...overrides,
});

describe('InventoryService', () => {
    let service: InventoryService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new InventoryService();
    });

    describe('get', () => {
        it('should return the inventory item when found', async () => {
            const item = makeInventoryItem();
            (dsClient.get as jest.Mock).mockResolvedValue(item);

            const result = await service.get('123', Storable.Skip);

            expect(dsClient.get).toHaveBeenCalledWith('/user/:id/inventory/:storableId', {
                id: '123',
                storableId: Storable.Skip,
            });
            expect(result).toEqual(item);
        });

        it('should return null on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            const result = await service.get('123', Storable.Skip);

            expect(result).toBeNull();
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.get('123', Storable.Skip)).rejects.toThrow('Server error');
        });
    });

    describe('add', () => {
        it('should post the amount and return the updated item', async () => {
            const item = makeInventoryItem({ qty: 4 });
            (dsClient.post as jest.Mock).mockResolvedValue(item);

            const result = await service.add('123', Storable.Skip, 1);

            expect(dsClient.post).toHaveBeenCalledWith(
                '/user/:id/inventory/:storableId',
                { id: '123', storableId: Storable.Skip },
                { amount: 1 }
            );
            expect(result).toEqual(item);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.add('123', Storable.Skip, 1)).rejects.toThrow('Server error');
        });
    });

    describe('consume', () => {
        it('should post and return the updated item when qty is sufficient', async () => {
            const item = makeInventoryItem({ qty: 2 });
            (dsClient.post as jest.Mock).mockResolvedValue(item);

            const result = await service.consume('123', Storable.Skip, 1);

            expect(dsClient.post).toHaveBeenCalledWith(
                '/user/:id/inventory/:storableId/consume',
                { id: '123', storableId: Storable.Skip },
                { amount: 1 }
            );
            expect(result).toEqual(item);
        });

        it('should return false on 409 (insufficient quantity)', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(409, 'Insufficient quantity'));

            const result = await service.consume('123', Storable.Skip, 5);

            expect(result).toBe(false);
        });

        it('should rethrow non-409 errors', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.consume('123', Storable.Skip, 1)).rejects.toThrow('Server error');
        });
    });
});
