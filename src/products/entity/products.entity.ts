import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Categories } from '../../categories/entity/categories.entity';
import { ProductMetadataDto } from '../dto/product-metadata.dto';
import { Unit } from '../enum/unit.enum';
import { ConsumerContentsDto } from '../dto/consumerContents.dto';
import { Exclude } from 'class-transformer';

@Index('products_pkey', ['id'], { unique: true })
@Index('products_name_key', ['name'], { unique: true })
@Unique(['name', 'sku_code'])
@Index('products_sku_code_key', ['sku_code'], { unique: true })
@Entity('products', { schema: 'store' })
export class ProductEntity {
  @PrimaryGeneratedColumn('increment')
  @ApiProperty()
  @Exclude()
  id: number;

  @Column('character varying')
  @ApiProperty()
  sku_code: string;

  @ApiProperty()
  @ManyToOne(() => Categories)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Categories;

  @ApiProperty()
  @Column()
  @Exclude()
  category_id: number;

  @Column('character varying', { name: 'name' })
  @ApiProperty()
  name: string;

  @Column('character varying', { nullable: true })
  @ApiProperty()
  packet_description: string;

  @Column('character varying')
  @ApiProperty()
  image_url: string;

  @Column('real', { nullable: true })
  @ApiProperty()
  @Exclude()
  serves1: number;

  @Column({ default: true })
  @ApiProperty()
  @Exclude()
  is_active: boolean;

  @Column('text')
  @ApiProperty()
  unit_of_measurement: Unit;

  @Column('real')
  @ApiProperty()
  @Exclude()
  market_price: number;

  @Column('real')
  @ApiProperty()
  sale_price: number;

  @Column('real', { nullable: true })
  @ApiProperty()
  per_pcs_weight: number;

  @Column('character varying', { nullable: true })
  @ApiProperty()
  per_pcs_suffix: string;

  @Column('real', { nullable: true })
  @ApiProperty()
  per_pcs_buffer: number;

  @Column('character varying')
  @ApiProperty()
  display_name: string;

  @Column('double precision', {
    default: () => "'0'",
  })
  @ApiProperty()
  min_quantity: number;

  @Column('double precision', {
    default: () => "'0'",
  })
  @ApiProperty()
  max_quantity: number;

  @Column('double precision', {
    default: () => "'0'",
  })
  @ApiProperty()
  @Exclude()
  buffer_quantity: number;

  @ApiProperty()
  @Column({ name: 'enable_pieces_request', default: false })
  @Exclude()
  enablePiecesRequest: boolean;

  @Column({
    name: 'is_coins_redeemable',
    type: 'int2',
    default: 0,
    nullable: true,
  })
  @ApiProperty()
  @Exclude()
  isCoinsRedeemable: number;

  @ApiPropertyOptional()
  @Column({ nullable: true, default: null })
  @Exclude()
  lithos_ref: number;

  @Column('timestamp with time zone', {
    default: () => 'now()',
  })
  @ApiProperty()
  @Exclude()
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty()
  @Exclude()
  updated_at: Date;

  @ApiProperty()
  @Column()
  @Exclude()
  updated_by: string;

  @Column('character varying')
  @ApiProperty()
  icon_url: string;

  @Column('jsonb', { name: 'metadata', default: {} })
  @ApiProperty({ type: ProductMetadataDto })
  metadata: ProductMetadataDto;

  @Column('jsonb', {
    name: 'videos',
    array: false,
    nullable: true,
  })
  @Exclude()
  videos: string[];

  @Column({ default: false })
  @Exclude()
  is_verified: boolean;

  @Column({ type: 'int4' })
  @Exclude()
  article_number: number;

  @Column({ type: 'int2' })
  @Exclude()
  sku_type: string;

  @Column('jsonb', { name: 'consumer_contents' })
  consumer_contents: ConsumerContentsDto;

  @Column('character varying')
  @Exclude()
  hsn: string;

  static createNewProduct(
    skuCode: string,
    name: string,
    displayName: string,
    image_url: string,
    market_price: number,
    sale_price: number,
    unit_of_measurement: Unit,
    article_number: number,
    category_id: number,
    skuType: string,
    isVerified: boolean,
    userId: string,
  ) {
    const productEntity = new ProductEntity();
    productEntity.sku_code = skuCode;
    productEntity.name = name;
    productEntity.display_name = displayName;
    productEntity.image_url = image_url;
    productEntity.market_price = market_price;
    productEntity.sale_price = sale_price;
    productEntity.unit_of_measurement = unit_of_measurement;
    productEntity.article_number = article_number;
    productEntity.category_id = category_id;
    productEntity.sku_type = skuType;
    productEntity.metadata = new ProductMetadataDto();
    productEntity.consumer_contents = new ConsumerContentsDto();
    productEntity.is_verified = isVerified;
    productEntity.updated_by = userId;
    return productEntity;
  }
}
