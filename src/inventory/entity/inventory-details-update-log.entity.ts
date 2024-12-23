import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InventoryEntity } from './inventory.entity';

@Entity('inventory_details_update_log', { schema: 'store' })
export class InventoryDetailsUpdateLogEntity {
  @PrimaryGeneratedColumn()
  id: bigint;

  @Column({ name: 'sku_code' })
  @ApiProperty()
  skuCode: string;

  @Column({ name: 'store_id' })
  @ApiProperty()
  storeId: string;

  @ApiProperty()
  @Column('jsonb', {
    name: 'old_inventory',
    array: false,
    nullable: false,
    default: () => "'{}'",
  })
  oldInventory: InventoryEntity;

  @ApiProperty()
  @Column('jsonb', {
    name: 'updated_inventory',
    array: false,
    nullable: false,
    default: () => "'{}'",
  })
  updatedInventory: InventoryEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @UpdateDateColumn({ name: 'modified_at' })
  modifiedAt: Date;

  @Column({ name: 'modified_by', type: 'uuid' })
  modifiedBy: string;

  static createInventoryUpdateLogEntity(
    oldInventory: InventoryEntity,
    updatedInventory: InventoryEntity,
    userId: string,
  ) {
    const inventoryUpdateLogsEntity = new InventoryDetailsUpdateLogEntity();
    inventoryUpdateLogsEntity.skuCode = oldInventory.sku_code;
    inventoryUpdateLogsEntity.storeId = oldInventory.store_id;
    inventoryUpdateLogsEntity.oldInventory = oldInventory;
    inventoryUpdateLogsEntity.updatedInventory = updatedInventory;
    inventoryUpdateLogsEntity.createdBy = userId;
    inventoryUpdateLogsEntity.modifiedBy = userId;
    return inventoryUpdateLogsEntity;
  }
}
