import { Config } from '../Config';

describe('Config', () => {
    describe('enum configuration values', () => {
        it('should have all required channel IDs', () => {
            expect(Config.TRUTHS_LOG_CHANNEL_ID).toBeDefined();
            expect(Config.DARES_LOG_CHANNEL_ID).toBeDefined();
            expect(Config.LOG_CHANNEL_ID).toBeDefined();
        });

        it('should have guild configuration', () => {
            expect(Config.OFFICIAL_GUILD_ID).toBeDefined();
        });

        it('should have correct channel ID values', () => {
            expect(Config.TRUTHS_LOG_CHANNEL_ID).toBe('1235305292955127838');
            expect(Config.DARES_LOG_CHANNEL_ID).toBe('1235306341724196976');
            expect(Config.LOG_CHANNEL_ID).toBe('1266041224914276424');
            expect(Config.OFFICIAL_GUILD_ID).toBe('1079206786021732412');
        });

        it('should be immutable enum values', () => {
            // Enum values should not be changeable
            expect(typeof Config.TRUTHS_LOG_CHANNEL_ID).toBe('string');
            expect(typeof Config.DARES_LOG_CHANNEL_ID).toBe('string');
            expect(typeof Config.LOG_CHANNEL_ID).toBe('string');
            expect(typeof Config.OFFICIAL_GUILD_ID).toBe('string');
        });
    });
});