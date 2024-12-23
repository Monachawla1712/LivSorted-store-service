import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SocietyMetadata, Tower } from './society.metadata';

@Entity('society', { schema: 'store' })
export class SocietyEntity {
  @PrimaryColumn('integer', { nullable: false })
  id: number;

  @Column('character varying', { nullable: false })
  name: string;

  @Column('double precision', { nullable: false })
  latitude: number;

  @Column('double precision', { nullable: false })
  longitude: number;

  @Column('jsonb', {
    name: 'tower',
    array: true,
    nullable: true,
  })
  tower: Tower[];

  @Column('integer', { nullable: false })
  store_id: number;

  @Column('character varying', { nullable: false })
  city: string;

  @Column('character varying', { nullable: false })
  state: string;

  @Column('character varying', { nullable: false })
  pincode: string;

  @Column('jsonb', {
    name: 'metadata',
    array: false,
    nullable: true,
  })
  metadata: SocietyMetadata;

  @Column('bool', { nullable: false })
  active: boolean;

  @UpdateDateColumn({
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;
}
