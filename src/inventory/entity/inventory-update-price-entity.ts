import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ColumnNumericTransformer } from './inventory.entity';
import { NumberFormat } from 'xlsx';

@Entity('inventory_update_price_log', { schema: 'store' })
export class InventoryUpdatePriceLogEntity {
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
  @Column('real', {
    name: 'from_market_price',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  fromMarketPrice: number;

  @ApiProperty()
  @Column('real', {
    name: 'to_market_price',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  toMarketPrice: number;

  @ApiProperty()
  @Column('real', {
    name: 'from_sale_price',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  fromSalePrice: number;

  @ApiProperty()
  @Column('real', {
    name: 'to_sale_price',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  toSalePrice: number;

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

  static createInventoryUpdateLogEntity(
    sku_code: string,
    source: string,
    store_id: string,
    fromMarketPrice: number,
    toMarketPrice: number,
    fromSalePrice: number,
    toSalePrice: number,
    userId: string,
  ) {
    const inventoryUpdateLogsEntity = new InventoryUpdatePriceLogEntity();
    inventoryUpdateLogsEntity.skuCode = sku_code;
    inventoryUpdateLogsEntity.storeId = store_id;
    inventoryUpdateLogsEntity.source = source;
    inventoryUpdateLogsEntity.fromMarketPrice = fromMarketPrice;
    inventoryUpdateLogsEntity.toMarketPrice = toMarketPrice;
    inventoryUpdateLogsEntity.fromSalePrice = fromSalePrice;
    inventoryUpdateLogsEntity.toSalePrice = toSalePrice;
    inventoryUpdateLogsEntity.createdBy = userId;
    inventoryUpdateLogsEntity.modifiedBy = userId;
    return inventoryUpdateLogsEntity;
  }
}
