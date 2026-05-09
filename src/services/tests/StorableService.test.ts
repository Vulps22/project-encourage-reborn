import { StorableService } from '../StorableService';
import { dsClient, DSError } from '../../client';
import { Storable } from '../../interface';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

const makeStorable = (overrides: Partial<Storable> = {}): Storable => ({
    id: 'skip',
    name: 'Skip',
    ...overrides,
});

describe('StorableService', () => {
    let service: StorableService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new StorableService();
    });

    describe('list', () => {
        it('should return all storables', async () => {
            const storables = [makeStorable(), makeStorable({ id: 'other', name: 'Other' })];
            (dsClient.get as jest.Mock).mockResolvedValue(storables);

            const result = await service.list();

            expect(dsClient.get).toHaveBeenCalledWith('/storable');
            expect(result).toEqual(storables);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.list()).rejects.toThrow('Server error');
        });
    });

    describe('get', () => {
        it('should return the storable when found', async () => {
            const storable = makeStorable();
            (dsClient.get as jest.Mock).mockResolvedValue(storable);

            const result = await service.get('skip');

            expect(dsClient.get).toHaveBeenCalledWith('/storable/:id', { id: 'skip' });
            expect(result).toEqual(storable);
        });

        it('should return null on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            const result = await service.get('unknown');

            expect(result).toBeNull();
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.get('skip')).rejects.toThrow('Server error');
        });
    });
});
