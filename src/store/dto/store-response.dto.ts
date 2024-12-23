import { StoreEntity } from '../entity/store.entity';

export class StoreResponse extends StoreEntity {
  distance: number;
  zoneId: string;
  message: string;
  timer: string;
  store_found: boolean;
}
