import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryMetadata } from "../dto/category-metadata.dto";

@Index('categories_pkey', ['id'], { unique: true })
@Index('categories_name_key', ['name'], { unique: true })
@Entity('categories', { schema: 'store' })
export class Categories {
  @ApiProperty()
  @PrimaryGeneratedColumn('increment')
  @Exclude()
  id: number;

  @ApiProperty()
  @Column('character varying', { name: 'name' })
  name: string;

  @ApiProperty()
  @Column('character varying', { name: 'image_url', default: null })
  image_url: string;

  @ApiProperty()
  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  @Exclude()
  createdAt: Date;

  @Column({ default: true })
  @Exclude()
  is_active: boolean;

  @ApiProperty()
  @UpdateDateColumn()
  @Exclude()
  updated_at: Date;

  @ApiProperty()
  @Column()
  @Exclude()
  updated_by: string;

  @ApiProperty()
  @Column()
  display_name:string;

  @ApiProperty()
  @Column()
  priority: number;

  @ApiProperty()
  @Column()
  order: number;

  @Column('jsonb', { name: 'metadata', default: {} })
  @ApiProperty({ type: CategoryMetadata })
  metadata: CategoryMetadata;
}
