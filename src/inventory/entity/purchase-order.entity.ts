import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { PurchaseOrderItemEntity } from './purchase-order-item.entity';

@Entity('purchase_orders', { schema: 'store' })
export class PurchaseOrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id', default: 1 })
  storeId: number;

  @Column({ name: 'po_id', length: 20, nullable: true })
  poId: string;

  @Column({ name: 'order_date', type: 'date', nullable: true })
  orderDate: string;

  @Column({ name: 'received_date', type: 'timestamp', nullable: true })
  receivedDate: string;

  @Column({ name: 'status', type: 'smallint', default: 0 })
  status: number;

  @Column({ name: 'active', type: 'int2', default: 1 })
  active: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @UpdateDateColumn({ name: 'modified_at' })
  modifiedAt: Date;

  @Column({ name: 'modified_by', type: 'uuid' })
  modifiedBy: string;

  @OneToMany(() => PurchaseOrderItemEntity, (item) => item.purchaseOrder)
  poItems: PurchaseOrderItemEntity[];

  static createPurchaseOrderEntity(
    storeId: string,
    poId: string,
    orderDate: string,
    receivedDate: string,
    status: number,
    userId: string,
  ) {
    const poEntity = new PurchaseOrderEntity();
    poEntity.storeId = Number(storeId);
    poEntity.poId = poId;
    poEntity.orderDate = orderDate;
    poEntity.receivedDate = receivedDate;
    poEntity.status = status;
    poEntity.active = 1;
    poEntity.createdBy = userId;
    poEntity.modifiedBy = userId;
    return poEntity;
  }
}
