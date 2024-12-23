import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SkuDiscount } from "../../common/dto/sku-discount.dto";

@Entity('society_sku_discount', { schema: 'store' })
export class SocietySkuDiscountEntity {
  @PrimaryColumn('integer', { nullable: false })
  id: number;

  @Column('integer', { name: 'society_id', nullable: false })
  societyId: number;

  @Column('jsonb', {
    name: 'sku_discount',
    array: true,
    nullable: true,
  })
  skuDiscounts: SkuDiscount[];

  @Column('double precision', { name: 'default_discount', nullable: false })
  defaultDiscount: number;

  @Column('boolean', { name: 'is_active', nullable: false })
  isActive: boolean;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('uuid', { nullable: false, name: 'updated_by' })
  updatedBy: string;

  @Column('boolean', { nullable: true, name: "is_maximum_price" })
  isMaximumPrice: boolean;

  @Column('date', { nullable: true, name: "valid_delivery_date" })
  validDeliveryDate: Date;

}
