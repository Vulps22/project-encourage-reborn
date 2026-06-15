import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { StorableService } from '../StorableService';
import { Storable as StorableInterface } from '@vulps22/project-encourage-types';
import { Storable } from '../../bot/types';

jest.mock('../../bot/services/DatabaseClient');

describe('StorableService', () => {
  let service: StorableService;
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getStorable: jest.fn(),
      listStorables: jest.fn(),
    } as any;

    service = new StorableService(mockDb);
  });

  describe('get', () => {
    it('should return the storable when it exists', async () => {
      const storable: StorableInterface = { id: Storable.Skip, name: 'Skip' };
      mockDb.getStorable.mockResolvedValue(storable);

      const result = await service.get(Storable.Skip);

      expect(mockDb.getStorable).toHaveBeenCalledWith(Storable.Skip);
      expect(result).toEqual(storable);
    });

    it('should return null when the storable does not exist', async () => {
      mockDb.getStorable.mockResolvedValue(null);

      const result = await service.get(Storable.Skip);

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return all storables', async () => {
      const storables: StorableInterface[] = [{ id: Storable.Skip, name: 'Skip' }];
      mockDb.listStorables.mockResolvedValue(storables);

      const result = await service.list();

      expect(mockDb.listStorables).toHaveBeenCalled();
      expect(result).toEqual(storables);
    });

    it('should return an empty array when no storables exist', async () => {
      mockDb.listStorables.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });
});
