import { DatabaseService } from '../DatabaseService';
import { StorableService } from '../StorableService';
import { Storable as StorableInterface } from '../../interface';
import { Storable } from '../../types';

jest.mock('../DatabaseService');

describe('StorableService', () => {
    let service: StorableService;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        mockDb = new DatabaseService({
            host: 'localhost',
            user: 'test',
            password: 'test',
            database: 'test',
        }) as jest.Mocked<DatabaseService>;

        service = new StorableService(mockDb);
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('should return the storable when it exists', async () => {
            const storable: StorableInterface = { id: Storable.Skip, name: 'Skip' };
            (mockDb.get as jest.Mock).mockResolvedValue(storable);

            const result = await service.get(Storable.Skip);

            expect(mockDb.get).toHaveBeenCalledWith('core', 'storables', { id: Storable.Skip });
            expect(result).toEqual(storable);
        });

        it('should return null when the storable does not exist', async () => {
            (mockDb.get as jest.Mock).mockResolvedValue(null);

            const result = await service.get(Storable.Skip);

            expect(result).toBeNull();
        });
    });

    describe('list', () => {
        it('should return all storables', async () => {
            const storables: StorableInterface[] = [{ id: Storable.Skip, name: 'Skip' }];
            (mockDb.list as jest.Mock).mockResolvedValue(storables);

            const result = await service.list();

            expect(mockDb.list).toHaveBeenCalledWith('core', 'storables');
            expect(result).toEqual(storables);
        });

        it('should return an empty array when no storables exist', async () => {
            (mockDb.list as jest.Mock).mockResolvedValue([]);

            const result = await service.list();

            expect(result).toEqual([]);
        });
    });
});
