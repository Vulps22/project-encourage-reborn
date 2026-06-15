import { DatabaseService } from '../db/DatabaseService';

export interface CoreConfig {
  id: 'config';
  vote_threshold: number;
  is_locked: boolean;
}

export class ConfigService {
  constructor(private db: DatabaseService) {}

  async getConfig(): Promise<CoreConfig | null> {
    return this.db.get<CoreConfig>('core', 'config', { id: 'config' });
  }

  async setLocked(locked: boolean): Promise<CoreConfig | null> {
    const result = await this.db.update(
      'core',
      'config',
      { is_locked: locked },
      { id: 'config' }
    );

    return result.rows && result.rows.length > 0 ? result.rows[0] as CoreConfig : null;
  }
}
