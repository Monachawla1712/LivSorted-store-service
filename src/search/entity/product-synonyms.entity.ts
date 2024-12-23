import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_synonyms', { schema: 'store' })
export class ProductSynonymsEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('character varying', { name: 'product_code', nullable: false })
  productCode: string;

  @Column('character varying', { name: 'synonym', nullable: false })
  synonym: string;

  @Column('character varying', { name: 'phonetic', nullable: false })
  phonetic: string;

  @Column('boolean', { default: true })
  is_active: boolean;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('character varying', {
    name: 'created_by',
    nullable: true,
  })
  createdBy: string;

  @UpdateDateColumn({
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  @Column('character varying', {
    name: 'updated_by',
    nullable: true,
  })
  updatedBy: string;
}
