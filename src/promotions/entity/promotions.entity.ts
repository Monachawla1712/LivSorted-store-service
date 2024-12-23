import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('promotions', { schema: 'store' })
export class PromotionsEntity {
  @PrimaryGeneratedColumn('increment')
  @ApiProperty()
  id: number;

  // @Column('character varying', { unique: true })
  @Column('character varying')
  @ApiProperty()
  name: string;

  @Column('character varying', { array: true, nullable: true })
  @ApiProperty()
  sku_codes: string[];

  @ApiProperty()
  @Column('character varying')
  promotion_level: string;

  @ApiProperty()
  @Column('character varying')
  promotion_value: string;

  @ApiProperty()
  @Column('character varying')
  message: string;

  @ApiProperty()
  @Column('boolean')
  is_active: boolean;

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
}
