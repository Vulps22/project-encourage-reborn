/**
 * ButtonHandler type for defining button interaction handlers
 */
export type Handler<T> = {
    name: string;
    execute: (interaction: T) => Promise<void>;
};