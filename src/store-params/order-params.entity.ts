import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'params', schema: 'oms_trans_' })
export class OrderParamsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  param_key: string;

  @Column()
  param_name: string;

  @Column()
  param_value: string;

  @Column()
  active: number;

  @Column()
  is_editable: number;

  @Column()
  is_public: number;
}
