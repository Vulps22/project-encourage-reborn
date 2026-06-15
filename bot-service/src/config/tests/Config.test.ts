describe('Config', () => {
    describe('configuration values', () => {
        let Config: typeof import('../index')['Config'];

        beforeAll(async () => {
            process.env.ENVIRONMENT = 'stage';
            ({ Config } = await import('../index'));
        });

        it('should have all required channel IDs', () => {
            expect(Config.TRUTHS_LOG_CHANNEL_ID).toBeDefined();
            expect(Config.DARES_LOG_CHANNEL_ID).toBeDefined();
            expect(Config.LOG_CHANNEL_ID).toBeDefined();
        });

        it('should have guild configuration', () => {
            expect(Config.OFFICIAL_GUILD_ID).toBeDefined();
        });

        it('should have string values', () => {
            expect(typeof Config.TRUTHS_LOG_CHANNEL_ID).toBe('string');
            expect(typeof Config.DARES_LOG_CHANNEL_ID).toBe('string');
            expect(typeof Config.LOG_CHANNEL_ID).toBe('string');
            expect(typeof Config.OFFICIAL_GUILD_ID).toBe('string');
        });
    });
});
