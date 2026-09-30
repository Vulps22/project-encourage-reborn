import { Entitlement } from 'discord.js';
import { Logger } from '@vulps22/logger';
import { EntitlementHandler } from '../../utils';
import { entitlementService, inventoryService } from '../../services';

const SKIPS_PER_PACK = 10;

const skipPack: EntitlementHandler = {
    name: 'skip-pack',

    async create(entitlement: Entitlement): Promise<void> {
        if (!await entitlementService.claim(entitlement)) {
            Logger.log(`Skip pack entitlement ${entitlement.id} already fulfilled - ignoring`);
            return;
        }

        try {
            await inventoryService.add(entitlement.userId, 'skip', SKIPS_PER_PACK);
        } catch (error) {
            // Nothing was granted, so free the claim for a redelivery or retry to pick up.
            await entitlementService.release(entitlement.id).catch((releaseError: unknown) => {
                Logger.error(`Failed to release claim on skip pack entitlement ${entitlement.id}: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`);
            });
            throw error;
        }

        // The skips are granted and the claim prevents a re-grant, so a failed consume
        // is logged rather than rethrown.
        try {
            await entitlement.consume();
            await entitlementService.markConsumed(entitlement.id);
        } catch (error) {
            Logger.error(`Granted skip pack entitlement ${entitlement.id} but failed to consume it: ${error instanceof Error ? error.message : String(error)}`);
        }
    },

    async delete(entitlement: Entitlement): Promise<void> {
        if (!await entitlementService.revoke(entitlement.id)) {
            Logger.log(`Skip pack entitlement ${entitlement.id} was never fulfilled or is already revoked - ignoring`);
            return;
        }

        // Refunds floor at 0 - skips already used can't be taken back.
        const item = await inventoryService.get(entitlement.userId, 'skip');
        const deduction = Math.min(item?.qty ?? 0, SKIPS_PER_PACK);

        if (deduction > 0) {
            await inventoryService.consume(entitlement.userId, 'skip', deduction);
        }
    },
};

export default skipPack;
