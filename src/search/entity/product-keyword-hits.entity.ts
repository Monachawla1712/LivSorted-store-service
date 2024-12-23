import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_keyword_hits', { schema: 'store' })
@Unique(['keyword', 'productCode'])
@Index('keyword_key', ['keyword', 'productCode'], { unique: true })
export class ProductKeywordHitsEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('character varying', { name: 'product_code', nullable: false })
  productCode: string;

  @Column('character varying', { name: 'keyword', nullable: false })
  keyword: string;

  @Column('character varying', { name: 'hits', nullable: false })
  hits: number;

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
}
