import {
    Entity,
    Column,
    UpdateDateColumn,
    PrimaryColumn
} from 'typeorm';
import {SkuDiscount} from "../../common/dto/sku-discount.dto";

@Entity({schema: 'store', name: 'audience_sku_discount'})
export class AudienceSkuDiscountEntity {
    @PrimaryColumn('integer', {nullable: false})
    id: number;

    @Column('integer', {name: 'audience_id', nullable: false})
    audience_id: number;

    @Column('jsonb', {
        name: 'sku_discount',
        array: true,
        nullable: true,
    })
    sku_discount: SkuDiscount[];

    @Column('boolean', {name: 'is_active', nullable: false})
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

    @Column('uuid', {nullable: false, name: 'updated_by'})
    updatedBy: string;

    @Column('date', {name: 'valid_delivery_date', nullable: false})
    validDeliveryDate: Date;
}