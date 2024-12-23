import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ProductEntity } from '../../products/entity/products.entity';
import { StoreEntity } from '../../store/entity/store.entity';
import { PriceBracketDto } from '../dto/priceBracket.dto';
import { Unit } from '../../products/enum/unit.enum';
import { Grade, InventoryGrade } from '../../products/dto/consumerContents.dto';
import { InventoryMetadataDto } from '../dto/inventory-metadata.dto';
import { Exclude } from 'class-transformer';

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Index('inventory_pkey', ['id'], { unique: true })
@Unique(['sku_code', 'store_id'])
@Entity('inventory', { schema: 'store' })
export class InventoryEntity {
  @ApiProperty()
  @Column('uuid', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @ApiProperty()
  @Column('double precision', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  quantity: number;

  @ApiProperty()
  @Column('double precision', {
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  total_quantity: number;

  @ApiProperty()
  @Column('real', { default: 0, transformer: new ColumnNumericTransformer() })
  market_price: number;

  @Column('real', {
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  sale_price: number;

  @Column()
  @ApiProperty()
  sku_code: string;

  @Column('jsonb', { name: 'price_brackets', default: [] })
  @ApiProperty({ type: PriceBracketDto })
  price_brackets: PriceBracketDto[];

  @ApiProperty()
  @ManyToOne(() => ProductEntity, (products) => products.sku_code, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'sku_code', referencedColumnName: 'sku_code' })
  product: ProductEntity;

  @Column()
  @ApiProperty()
  store_id: string;

  @Column({ default: true })
  @ApiProperty()
  is_active: boolean;

  @Column({ default: false })
  @ApiProperty()
  is_complimentary: boolean;

  @ApiProperty()
  @ManyToOne(() => StoreEntity, (stores) => stores.store_id, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'store_id' })
  store: StoreEntity;

  @ApiProperty()
  @Column('timestamp with time zone', {
    default: () => 'now()',
  })
  @Exclude()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  @Exclude()
  updated_at: Date;

  @ApiProperty()
  @Column()
  @Exclude()
  updated_by: string;

  @Column({ type: 'int4' })
  article_number: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  unit_of_measurement: Unit;

  @Column({ default: false })
  is_price_update_allowed: boolean;

  @Column('numeric', {
    transformer: new ColumnNumericTransformer(),
  })
  hold: number;

  @Column('numeric', {
    transformer: new ColumnNumericTransformer(),
  })
  dump: number;

  @Column('jsonb', { name: 'grades' })
  grades: InventoryGrade[];

  @Column('jsonb', { name: 'metadata', array: false, nullable: true })
  metadata: InventoryMetadataDto;

  @Column()
  availability: number;
  
  @Exclude()
  max_price: number;

  static createNewInventoryEntry(
    storeId: string,
    skuCode: string,
    quantity: number,
    priceBrackets: PriceBracketDto[],
    name: string,
    marketPrice: number,
    salePrice: number,
    unitOfMeasurement: Unit,
    articleNumber: number,
    grades: Grade[],
    userId: string,
    availability: number,
    isComplimentary: boolean = false,
    metadata: InventoryMetadataDto = new InventoryMetadataDto(),
  ) {
    const inventoryEntity = new InventoryEntity();
    inventoryEntity.store_id = storeId;
    inventoryEntity.sku_code = skuCode;
    inventoryEntity.name = name;
    inventoryEntity.market_price = marketPrice;
    inventoryEntity.sale_price = salePrice;
    inventoryEntity.unit_of_measurement = unitOfMeasurement;
    inventoryEntity.article_number = articleNumber;
    inventoryEntity.quantity = quantity;
    inventoryEntity.total_quantity = quantity;
    if (metadata != null) {
      inventoryEntity.metadata = metadata;
    }
    if (priceBrackets != null) {
      inventoryEntity.price_brackets = priceBrackets;
    } else {
      inventoryEntity.price_brackets = [];
    }
    inventoryEntity.grades = grades;
    inventoryEntity.updated_by = userId;
    inventoryEntity.availability = availability;
    inventoryEntity.is_complimentary = isComplimentary;
    return inventoryEntity;
  }
}
