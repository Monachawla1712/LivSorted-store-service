import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1668655507363 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "store"."products"
        ADD "per_pcs_buffer" real
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
