import { Entitlement } from 'discord.js';

/**
 * EntitlementHandler type for defining what a purchasable does when Discord
 * creates, updates or deletes an entitlement for it.
 *
 * `name` must match the purchasable's `name` slug in entitlement.purchasables -
 * that slug is how an entitlement's SKU is routed to its handler.
 */
export type EntitlementHandler = {
    name: string;
    create: (entitlement: Entitlement) => Promise<void>;
    update?: (entitlement: Entitlement) => Promise<void>;
    delete: (entitlement: Entitlement) => Promise<void>;
};
