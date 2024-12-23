import { StoreMetadata } from '../entity/store.entity';
import { StoreStatus } from '../enum/store.status';

export class NearbyStoreListItemResponseDto {
  id: number = null;
  store_id: string = null;
  name: string = null;
  location: string = null;
  addressLine_1: string = null;
  addressLine_2: string | null = null;
  landmark: string | null = null;
  city: string = null;
  state: string = null;
  pincode: number = null;
  contactNumber: string | null = null;
  metadata: StoreMetadata = null;
  pocName: string = null;
  pocContactNo: string = null;
  storeCategory: string = null;
  createdBy: string = null;
  approvedBy: string = null;
  storeImages: object = null;
  storeVideos: object = null;
  deliveryOpenTime: string = null;
  storeLocationType: string = null;
  storeSubtype: string = null;
  lastOrderDate: string = null;
  walletAmount: number = null;
  lifetimeOrderCount: number = null;

  distance: number = null;
  isActive: boolean = null;
  status: StoreStatus = null;
}
