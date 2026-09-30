/**
 * A row of DS's entitlement.purchasables catalogue. `name` doubles as the slug
 * that routes an entitlement to its EntitlementHandler.
 */
export interface Purchasable {
    id: number;
    application_id: string;
    environment: PurchasableEnvironment;
    name: string;
    sku_id: string;
    type: 'consumable' | 'subscription';
    created_at: string;
}

export type PurchasableEnvironment = 'dev' | 'prod';

/** Lookup keys for GET /api/v1/entitlement/purchasable */
export interface PurchasableQuery {
    sku?: string;
    name?: string;
    env?: PurchasableEnvironment;
}
