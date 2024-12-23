import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreStatus } from '../enum/store.status';
import Any = jasmine.Any;
import { InventoryView } from '../enum/inventory-view.enum';
import { GeoJSONGeometry } from '../dto/GeoJson.interface';
import { Exclude } from 'class-transformer';

export class StoreMetadata {
  amenities: string[] = null;
  locationCaptureAccuracy: number = null;
  gstNumber: string = null;
  panNumber: string = null;
  journeyStartTime = null;
  approverName = null;
  remarks = null;
}

@Index('stores_pkey', ['id'], { unique: true })
@Entity('stores', { schema: 'store' })
export class StoreEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('character varying', { name: 'store_id', unique: true })
  store_id: string;

  @Column('character varying', { name: 'name' })
  name: string;

  @Column('uuid', { name: 'owner_id' })
  ownerId: string;

  @Column('character varying', { name: 'owner_name' })
  @Exclude()
  ownerName: string;

  @Column('boolean', { name: 'is_active', default: () => 'false' })
  @Exclude()
  isActive: boolean;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    name: 'location',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Point',
  })
  location: GeoJSONGeometry;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    name: 'boundry',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Polygon',
  })
  boundry: string;

  @Column('boolean', { name: 'is_bounded', default: false })
  isBounded: boolean;

  @Column('character varying', { name: 'address_line_1' })
  addressLine_1: string;

  @Column('character varying', { name: 'address_line_2', nullable: true })
  addressLine_2: string | null;

  @Column('character varying', { name: 'landmark', nullable: true })
  landmark: string | null;

  @Column('character varying', { name: 'city' })
  city: string;

  @Column('character varying', { name: 'state' })
  state: string;

  @Column('integer', { name: 'pincode' })
  pincode: number;

  @Column('boolean', { default: true })
  is_open: boolean;

  @Column('character varying', { name: 'contact_number', nullable: true })
  contactNumber: string | null;

  @Column('character varying', { name: 'upi_id', nullable: true })
  upiId: string | null;

  @Column('integer', { name: 'min_eta', nullable: true })
  min_eta: number;

  @Column('integer', { name: 'max_eta', nullable: true })
  max_eta: number;

  @Column({ nullable: true, default: null })
  lithos_ref: number;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    default: () => 'now()',
  })
  @Exclude()
  updatedAt: Date;

  @Column('character varying', {
    name: 'updated_by',
  })
  @Exclude()
  updatedBy: string;

  @Column('character varying', { name: 'open_time', nullable: true })
  open_time: string;

  @Column('character varying', { name: 'close_time', nullable: true })
  close_time: string;

  @Column('character varying', {
    name: 'store_type',
    nullable: false,
    default: 'DEFAULT',
  })
  store_type: string;

  @Column({ nullable: true })
  status: StoreStatus;

  @Column({ name: 'is_delivery_enabled', nullable: true })
  isDeliveryEnabled: number;

  @Column('jsonb', {
    name: 'images',
    array: false,
    default: () => "'[]'",
    nullable: true,
  })
  images: Any;

  @Column('jsonb', {
    name: 'metadata',
    array: false,
    nullable: true,
  })
  metadata: StoreMetadata;

  @Column('jsonb', {
    name: 'offer_images',
    array: false,
    default: () => "'[]'",
    nullable: true,
  })
  offerImages: object;

  @Column('character varying', { name: 'poc_name' })
  pocName: string;

  @Column('character varying', { name: 'poc_contact_no' })
  pocContactNo: string;

  @Column('boolean', { name: 'collect_cash', default: false })
  collectCash: boolean;

  @Column('boolean', { name: 'is_unloading_reqd', default: true })
  isUnloadingReqd: boolean;

  @Column('character varying', { name: 'store_category' })
  storeCategory: string;

  @Column('integer', { name: 'easebuzz_virtual_account_id' })
  easebuzzVirtualAccountId: number;

  @Column('character varying', { name: 'easebuzz_qr_code' })
  easebuzzQrCode: string;

  @Column('uuid', {
    name: 'created_by',
  })
  createdBy: string;

  @Column('uuid', {
    name: 'approved_by',
  })
  approvedBy: string;

  @Column('jsonb', {
    name: 'store_images',
    nullable: true,
  })
  storeImages: object;

  @Column('jsonb', {
    name: 'store_videos',
    nullable: true,
  })
  storeVideos: string[];

  @Column({ name: 'delivery_open_time', type: 'time', nullable: true })
  deliveryOpenTime: string;

  @Column('character varying', { name: 'store_location_type' })
  storeLocationType: string;

  @Column('character varying', { name: 'store_delivery_type' })
  storeDeliveryType: string;

  @Column({
    name: 'inventory_view',
    type: 'enum',
    enum: InventoryView,
  })
  inventoryView: InventoryView;

  @Column('character varying', { name: 'store_subtype' })
  storeSubtype: string;

  @Column('integer', { name: 'sales_potential', nullable: true })
  salesPotential: number;

  @Column('integer', { name: 'cluster_id' })
  clusterId: number;

  @Column('integer', { name: 'verification_retry_count' })
  verificationRetryCount: number;

  @Column('character varying', { name: 'duplicate_id' })
  duplicateId: string;

  static createNewStore(
    ownerId: string,
    ownerName: string,
    name: string,
    addressLine_1: string,
    addressLine_2: string,
    landmark: string,
    city: string,
    state: string,
    pincode: number,
    contactNumber: string,
    location: GeoJSONGeometry,
    pocName: string,
    pocContactNo: string,
    openTime: string,
    closeTime: string,
    storeType: string,
    storeStatus: StoreStatus,
    storeCategory: string,
    storeImages: string[],
    storeVideos: string[],
    storeLocationType: string,
    storeDeliveryType: string,
    storeSubtype: string,
    salesPotential: number,
    userId: string,
  ): StoreEntity {
    const store = new StoreEntity();
    store.ownerId = ownerId;
    store.ownerName = ownerName;
    store.name = name;
    store.addressLine_1 = addressLine_1;
    store.addressLine_2 = addressLine_2;
    store.landmark = landmark;
    store.city = city;
    store.state = state;
    store.pincode = pincode;
    store.contactNumber = contactNumber;
    store.location = location;
    store.pocName = pocName;
    store.pocContactNo = pocContactNo;
    store.open_time = openTime;
    store.deliveryOpenTime = store.open_time;
    store.metadata = new StoreMetadata();
    store.close_time = closeTime;
    store.store_type = storeType;
    store.status = storeStatus;
    store.storeCategory = storeCategory;
    store.isDeliveryEnabled = 0;
    store.storeImages = storeImages;
    store.storeVideos = storeVideos;
    store.storeLocationType = storeLocationType;
    store.storeDeliveryType = storeDeliveryType;
    store.storeSubtype = storeSubtype;
    store.salesPotential = salesPotential;
    store.verificationRetryCount = 0;
    store.isActive = true;
    store.updatedBy = userId;
    store.createdBy = userId;
    return store;
  }
}
