import { Storable } from '../types';

/**
 * @deprecated Use Vulps22/project-encourage-types instead
 */
export interface InventoryItem {
  id: number;
  user_id: string;
  storable_id: Storable;
  qty: number;
}
