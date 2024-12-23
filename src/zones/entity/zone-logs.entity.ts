import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('zone_logs', { schema: 'store' })
export class ZoneLogsEntity {
  @PrimaryGeneratedColumn()
  id: bigint;

  @ApiProperty()
  @Column('uuid', { name: 'user_id' })
  userId: string;

  @ApiProperty()
  @Column('character varying', { name: 'latitude' })
  latitude: string;

  @ApiProperty()
  @Column('character varying', { name: 'longitude' })
  longitude: string;

  @ApiProperty()
  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;
}
