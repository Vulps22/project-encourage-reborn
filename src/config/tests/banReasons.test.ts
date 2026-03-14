import { banReasons, questionBanReasonList, serverBanReasonList, userBanReasonList } from '../banReasons';
import { TargetType } from '../../types';

describe('banReasons configuration', () => {
    describe('questionBanReasonList', () => {
        it('should have valid structure', () => {
            expect(Array.isArray(questionBanReasonList)).toBe(true);
            expect(questionBanReasonList.length).toBeGreaterThan(0);
            
            questionBanReasonList.forEach(reason => {
                expect(reason).toHaveProperty('label');
                expect(reason).toHaveProperty('value');
                expect(typeof reason.label).toBe('string');
                expect(typeof reason.value).toBe('string');
                expect(reason.label.length).toBeGreaterThan(0);
                expect(reason.value.length).toBeGreaterThan(0);
            });
        });

        it('should contain expected question ban reasons', () => {
            const expectedReasons = [
                'dangerous_illegal',
                'violates_guidelines',
                'not_english',
                'mentions_person',
                'wrong_category'
            ];

            expectedReasons.forEach(reason => {
                expect(questionBanReasonList.some(r => r.value === reason)).toBe(true);
            });
        });

        it('should have "other" option for custom reasons', () => {
            expect(questionBanReasonList.some(r => r.value === 'other')).toBe(true);
        });
    });

    describe('serverBanReasonList', () => {
        it('should have valid structure', () => {
            expect(Array.isArray(serverBanReasonList)).toBe(true);
            expect(serverBanReasonList.length).toBeGreaterThan(0);
            
            serverBanReasonList.forEach(reason => {
                expect(reason).toHaveProperty('label');
                expect(reason).toHaveProperty('value');
                expect(typeof reason.label).toBe('string');
                expect(typeof reason.value).toBe('string');
            });
        });

        it('should contain expected server ban reasons', () => {
            const expectedReasons = [
                'violates_guidelines',
                'underage_label',
                'underage_activity'
            ];

            expectedReasons.forEach(reason => {
                expect(serverBanReasonList.some(r => r.value === reason)).toBe(true);
            });
        });

        it('should have "other" option for custom reasons', () => {
            expect(serverBanReasonList.some(r => r.value === 'other')).toBe(true);
        });
    });

    describe('userBanReasonList', () => {
        it('should have valid structure', () => {
            expect(Array.isArray(userBanReasonList)).toBe(true);
            expect(userBanReasonList.length).toBeGreaterThan(0);
            
            userBanReasonList.forEach(reason => {
                expect(reason).toHaveProperty('label');
                expect(reason).toHaveProperty('value');
                expect(typeof reason.label).toBe('string');
                expect(typeof reason.value).toBe('string');
            });
        });

        it('should contain expected user ban reasons', () => {
            const expectedReasons = [
                'violates_guidelines',
                'suspected_underage',
                'activity_underage'
            ];

            expectedReasons.forEach(reason => {
                expect(userBanReasonList.some(r => r.value === reason)).toBe(true);
            });
        });

        it('should have "other" option for custom reasons', () => {
            expect(userBanReasonList.some(r => r.value === 'other')).toBe(true);
        });
    });

    describe('banReasons object', () => {
        it('should map TargetType enum values correctly', () => {
            expect(banReasons[TargetType.Question]).toBe(questionBanReasonList);
            expect(banReasons[TargetType.Server]).toBe(serverBanReasonList);
            expect(banReasons[TargetType.User]).toBe(userBanReasonList);
        });

        it('should have entries for all TargetType values', () => {
            Object.values(TargetType).forEach(targetType => {
                expect(banReasons[targetType]).toBeDefined();
                expect(Array.isArray(banReasons[targetType])).toBe(true);
            });
        });

        it('should provide type-safe access to ban reason arrays', () => {
            // TypeScript compilation ensures type safety
            const questionReasons = banReasons[TargetType.Question];
            const userReasons = banReasons[TargetType.User];
            const serverReasons = banReasons[TargetType.Server];

            expect(Array.isArray(questionReasons)).toBe(true);
            expect(Array.isArray(userReasons)).toBe(true);
            expect(Array.isArray(serverReasons)).toBe(true);
        });
    });

    describe('reason lists differences', () => {
        it('should have different reasons for different target types', () => {
            expect(questionBanReasonList).not.toEqual(serverBanReasonList);
            expect(questionBanReasonList).not.toEqual(userBanReasonList);
            expect(serverBanReasonList).not.toEqual(userBanReasonList);
        });

        it('should have some overlapping reasons between types', () => {
            // All types should have a guidelines violation reason
            const guidelinesReason = 'violates_guidelines';

            expect(questionBanReasonList.some(r => r.value === guidelinesReason)).toBe(true);
            expect(serverBanReasonList.some(r => r.value === guidelinesReason)).toBe(true);
            expect(userBanReasonList.some(r => r.value === guidelinesReason)).toBe(true);
        });

        it('should have question-specific reasons', () => {
            const questionSpecificReasons = [
                'not_question',
                'giver_dare',
                'poor_grammar'
            ];

            questionSpecificReasons.forEach(reason => {
                expect(questionBanReasonList.some(r => r.value === reason)).toBe(true);
                expect(serverBanReasonList.some(r => r.value === reason)).toBe(false);
                expect(userBanReasonList.some(r => r.value === reason)).toBe(false);
            });
        });
    });

    describe('label formatting', () => {
        it('should have numbered labels for questions', () => {
            questionBanReasonList.forEach((reason, index) => {
                if (index < questionBanReasonList.length - 1) { // Exclude "Other" option
                    expect(reason.label).toMatch(/^\d+\s-\s/);
                }
            });
        });

        it('should have numbered labels for servers', () => {
            serverBanReasonList.forEach((reason, index) => {
                if (index < serverBanReasonList.length - 1) { // Exclude "Other" option
                    expect(reason.label).toMatch(/^\d+\s-\s/);
                }
            });
        });

        it('should have numbered labels for users', () => {
            userBanReasonList.forEach((reason, index) => {
                if (index < userBanReasonList.length - 1) { // Exclude "Other" option
                    expect(reason.label).toMatch(/^\d+\s-\s/);
                }
            });
        });
    });
});