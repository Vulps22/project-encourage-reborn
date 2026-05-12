import { InventoryService } from '../InventoryService';
import { dsClient, DSError } from '../../client';
import { InventoryItem } from '@vulps22/project-encourage-types';

jest.mock('../../client', () => ({
    dsClient: {
        getInventoryItem: jest.fn(),
        addInventoryItem: jest.fn(),
        consumeInventoryItem: jest.fn(),
    },
    DSError: jest.requireActual('../../client').DSError,
}));

const makeInventoryItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: 1,
    user_id: '123',
    storable_id: { id: 'skip', name: 'Skip' },
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
            (dsClient.getInventoryItem as jest.Mock).mockResolvedValue(item);

            const result = await service.get('123', 'skip');

            expect(dsClient.getInventoryItem).toHaveBeenCalledWith('123', 'skip');
            expect(result).toEqual(item);
        });

        it('should return null on 404', async () => {
            (dsClient.getInventoryItem as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            const result = await service.get('123', 'skip');

            expect(result).toBeNull();
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.getInventoryItem as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.get('123', 'skip')).rejects.toThrow('Server error');
        });
    });

    describe('add', () => {
        it('should call addInventoryItem and return the updated item', async () => {
            const item = makeInventoryItem({ qty: 4 });
            (dsClient.addInventoryItem as jest.Mock).mockResolvedValue(item);

            const result = await service.add('123', 'skip', 1);

            expect(dsClient.addInventoryItem).toHaveBeenCalledWith('123', 'skip', 1);
            expect(result).toEqual(item);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.addInventoryItem as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.add('123', 'skip', 1)).rejects.toThrow('Server error');
        });
    });

    describe('consume', () => {
        it('should call consumeInventoryItem and return the updated item when qty is sufficient', async () => {
            const item = makeInventoryItem({ qty: 2 });
            (dsClient.consumeInventoryItem as jest.Mock).mockResolvedValue(item);

            const result = await service.consume('123', 'skip', 1);

            expect(dsClient.consumeInventoryItem).toHaveBeenCalledWith('123', 'skip', 1);
            expect(result).toEqual(item);
        });

        it('should return false when qty is insufficient', async () => {
            (dsClient.consumeInventoryItem as jest.Mock).mockResolvedValue(false);

            const result = await service.consume('123', 'skip', 5);

            expect(result).toBe(false);
        });

        it('should rethrow non-409 errors', async () => {
            (dsClient.consumeInventoryItem as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.consume('123', 'skip', 1)).rejects.toThrow('Server error');
        });
    });
});
