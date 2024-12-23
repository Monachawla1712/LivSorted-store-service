import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('zones', { schema: 'store' })
export class ZoneEntity {
  @PrimaryColumn()
  id: string;

  @Column('character varying', { name: 'store_id' })
  storeId: string;

  @Column('character varying', { name: 'name' })
  name: string;

  @Column('boolean', { name: 'is_active', default: () => 'false' })
  isActive: boolean;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    name: 'zone_polygon',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Polygon',
  })
  zonePolygon: string;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    name: 'drop_point',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Point',
  })
  dropPoint: string;

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
