import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InventoryViewRequestStatus } from '../enum/inventory-view-request-status.enum';
import { StoreEntity } from './store.entity';

@Entity('inventory_view_requests', { schema: 'store' })
export class InventoryViewRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('character varying', { name: 'store_id' })
  storeId: string;

  @Column({
    name: 'status',
  })
  status: InventoryViewRequestStatus;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('character varying', {
    name: 'updated_by',
  })
  updatedBy: string;

  @Column('uuid', {
    name: 'created_by',
  })
  createdBy: string;

  @Column('uuid', {
    name: 'approved_by',
  })
  approvedBy: string;

  @Column('int2', { name: 'active' })
  active = 1;
  store: StoreEntity;

  static createInventoryRequestEntity(storeId: string, userId: string) {
    const inventoryViewRequestEntity = new InventoryViewRequestEntity();
    inventoryViewRequestEntity.storeId = storeId;
    inventoryViewRequestEntity.createdBy = userId;
    inventoryViewRequestEntity.updatedBy = userId;
    inventoryViewRequestEntity.status = InventoryViewRequestStatus.PENDING;
    return inventoryViewRequestEntity;
  }
}
