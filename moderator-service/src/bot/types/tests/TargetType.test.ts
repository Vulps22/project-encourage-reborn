import { TargetType } from '@vulps22/project-encourage-types';

describe('TargetType enum', () => {
    it('should have correct string values', () => {
        expect(TargetType.User).toBe('user');
        expect(TargetType.Server).toBe('server');
        expect(TargetType.Question).toBe('question');
    });

    it('should have exactly three values', () => {
        const enumValues = Object.values(TargetType);
        expect(enumValues).toHaveLength(3);
    });

    it('should contain all expected values', () => {
        const enumValues = Object.values(TargetType);
        expect(enumValues).toContain('user');
        expect(enumValues).toContain('server');
        expect(enumValues).toContain('question');
    });

    it('should have correct keys', () => {
        const enumKeys = Object.keys(TargetType);
        expect(enumKeys).toContain('User');
        expect(enumKeys).toContain('Server');
        expect(enumKeys).toContain('Question');
        expect(enumKeys).toHaveLength(3);
    });

    it('should be usable as object keys', () => {
        const testObject = {
            [TargetType.User]: 'user data',
            [TargetType.Server]: 'server data',
            [TargetType.Question]: 'question data'
        };

        expect(testObject[TargetType.User]).toBe('user data');
        expect(testObject[TargetType.Server]).toBe('server data');
        expect(testObject[TargetType.Question]).toBe('question data');
    });

    it('should be usable in switch statements', () => {
        function getTargetDescription(target: TargetType): string {
            switch (target) {
                case TargetType.User:
                    return 'Discord user';
                case TargetType.Server:
                    return 'Discord server';
                case TargetType.Question:
                    return 'Truth or dare question';
                default:
                    return 'Unknown target';
            }
        }

        expect(getTargetDescription(TargetType.User)).toBe('Discord user');
        expect(getTargetDescription(TargetType.Server)).toBe('Discord server');
        expect(getTargetDescription(TargetType.Question)).toBe('Truth or dare question');
    });

    it('should support enumeration', () => {
        const allTargets: TargetType[] = [];
        
        for (const targetType in TargetType) {
            if (Object.prototype.hasOwnProperty.call(TargetType, targetType)) {
                allTargets.push(TargetType[targetType as keyof typeof TargetType]);
            }
        }

        expect(allTargets).toContain(TargetType.User);
        expect(allTargets).toContain(TargetType.Server);
        expect(allTargets).toContain(TargetType.Question);
        expect(allTargets).toHaveLength(3);
    });

    it('should be comparable with string literals', () => {
        expect(TargetType.User === 'user').toBe(true);
        expect(TargetType.Server === 'server').toBe(true);
        expect(TargetType.Question === 'question').toBe(true);
        
        // Test that enum values don't match capitalized versions
        expect(TargetType.User === ('User' as any)).toBe(false);
        expect(TargetType.Server === ('Server' as any)).toBe(false);
        expect(TargetType.Question === ('Question' as any)).toBe(false);
    });

    it('should work with array includes', () => {
        const validTargets = [TargetType.User, TargetType.Server];
        
        expect(validTargets.includes(TargetType.User)).toBe(true);
        expect(validTargets.includes(TargetType.Server)).toBe(true);
        expect(validTargets.includes(TargetType.Question)).toBe(false);
    });

    it('should work with Object.values() iteration', () => {
        const processedTargets: string[] = [];
        
        Object.values(TargetType).forEach(targetType => {
            processedTargets.push(`processed_${targetType}`);
        });

        expect(processedTargets).toContain('processed_user');
        expect(processedTargets).toContain('processed_server');
        expect(processedTargets).toContain('processed_question');
        expect(processedTargets).toHaveLength(3);
    });

    it('should maintain type safety', () => {
        // This test ensures TypeScript type checking works correctly
        function processTarget(target: TargetType): string {
            return `Processing ${target}`;
        }

        expect(processTarget(TargetType.User)).toBe('Processing user');
        expect(processTarget(TargetType.Server)).toBe('Processing server');
        expect(processTarget(TargetType.Question)).toBe('Processing question');
    });
});