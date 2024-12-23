import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { PurchaseOrderEntity } from './purchase-order.entity';

@Entity('purchase_order_items', { schema: 'store' })
export class PurchaseOrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'po_id', type: 'bigint' })
  poId: number;

  @Column({ name: 'sku_code', length: 15 })
  skuCode: string;

  @Column({ name: 'sku_name', length: 100, nullable: true })
  skuName: string;

  @Column({ name: 'received_qty', type: 'double precision', nullable: true })
  receivedQty: number;

  @Column({ name: 'rtv', type: 'double precision', nullable: true })
  rtv: number;

  @Column({ name: 'final_qty', type: 'double precision', nullable: true })
  finalQty: number;

  @Column({ name: 'cost_price', type: 'double precision', nullable: true })
  costPrice: number;

  @Column({ name: 'final_amount', type: 'double precision', nullable: true })
  finalAmount: number;

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

  @ManyToOne(() => PurchaseOrderEntity, (order) => order.poItems)
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrderEntity;

  static createPurchaseOrderItemEntity(
    poId: number,
    skuCode: string,
    skuName: string,
    receivedQty: number,
    rtv: number,
    finalQty: number,
    costPrice: number,
    finalAmount: number,
    userId: string,
  ) {
    const poItemEntity = new PurchaseOrderItemEntity();
    poItemEntity.poId = poId;
    poItemEntity.skuCode = skuCode;
    poItemEntity.skuName = skuName;
    poItemEntity.receivedQty = receivedQty;
    poItemEntity.rtv = rtv;
    poItemEntity.finalQty = finalQty;
    poItemEntity.costPrice = costPrice;
    poItemEntity.finalAmount = finalAmount;
    poItemEntity.active = 1;
    poItemEntity.createdBy = userId;
    poItemEntity.modifiedBy = userId;
    return poItemEntity;
  }
}
