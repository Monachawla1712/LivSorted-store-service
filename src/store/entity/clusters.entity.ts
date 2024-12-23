import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('clusters', { schema: 'store' })
export class ClusterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string;

  @Column({ name: 'wh_id', type: 'int', default: 1 })
  whId: number;

  @Column({
    name: 'polygon',
    type: 'geometry',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Polygon',
  })
  polygon: any;

  @Column({
    name: 'start_point',
    type: 'geometry',
    nullable: true,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  startPoint: any;

  @Column({ name: 'active', type: 'int', default: 1 })
  active: number;
}
