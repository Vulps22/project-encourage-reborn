import { Storable } from '../types';

export interface InventoryItem {
  id: number;
  user_id: string;
  storable_id: Storable;
  qty: number;
}
