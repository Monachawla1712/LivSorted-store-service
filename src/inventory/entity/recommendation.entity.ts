import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, UpdateDateColumn, Unique } from 'typeorm';

@Index('recommendation_pkey', ['id'], { unique: true })
@Unique(['user_id', 'sku_code'])
@Entity('recommendation', { schema: 'store' })
export class RecommendationEntity {
  @ApiProperty()
  @Column('uuid', {
    primary: true,
    name: 'id',
    default: () => 'gen_random_uuid()',
  })
  id: string;

  @ApiProperty()
  @Column('double precision')
  quantity: number;

  @Column()
  @ApiProperty()
  user_id: string;

  @Column()
  @ApiProperty()
  sku_code: string;

  @ApiProperty()
  @UpdateDateColumn()
  time_stamp: Date;
}
