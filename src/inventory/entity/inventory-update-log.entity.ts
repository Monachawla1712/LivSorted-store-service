import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_update_log', { schema: 'store' })
export class InventoryUpdateLogEntity {
  @PrimaryGeneratedColumn()
  id: bigint;

  @ApiProperty()
  @Column({ name: 'sku_code' })
  skuCode: string;

  @ApiProperty()
  @Column({ name: 'source' })
  source: string;

  @ApiProperty()
  @Column({ name: 'store_id' })
  storeId: string;

  @ApiProperty()
  @Column('decimal', {
    precision: 10,
    scale: 3,
    nullable: true,
    name: 'update_qty',
  })
  updateQty: string;

  @ApiProperty()
  @Column('decimal', {
    precision: 10,
    scale: 3,
    nullable: true,
    name: 'from_inventory',
  })
  fromInventory: string;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 3, name: 'to_inventory' })
  toInventory: string;

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

  @ApiProperty()
  @Column('int2', { name: 'inventory_type' })
  inventoryType: number;

  @ApiProperty()
  @Column('int2', { name: 'inventory_update_type' })
  inventoryUpdateType: number;

  @ApiProperty()
  @Column('text', { name: 'movement_type' })
  movementType: string;

  @ApiProperty()
  @Column('text', { name: 'remarks' })
  remarks: string;

  static createInventoryUpdateLogEntity(
    sku_code: string,
    source: string,
    store_id: string,
    updateQuantity: number,
    fromQty: number,
    toQty: number,
    inventory_type: number,
    inventory_update_type: number,
    movement_type: string,
    userId: string,
  ) {
    const inventoryUpdateLogsEntity = new InventoryUpdateLogEntity();
    inventoryUpdateLogsEntity.skuCode = sku_code;
    inventoryUpdateLogsEntity.storeId = store_id;
    inventoryUpdateLogsEntity.source = source;
    inventoryUpdateLogsEntity.updateQty = String(updateQuantity);
    inventoryUpdateLogsEntity.fromInventory = String(fromQty);
    inventoryUpdateLogsEntity.toInventory = String(toQty);
    inventoryUpdateLogsEntity.inventoryType = inventory_type;
    inventoryUpdateLogsEntity.inventoryUpdateType = inventory_update_type;
    inventoryUpdateLogsEntity.movementType = movement_type;
    inventoryUpdateLogsEntity.createdBy = userId;
    inventoryUpdateLogsEntity.modifiedBy = userId;
    return inventoryUpdateLogsEntity;
  }
}
