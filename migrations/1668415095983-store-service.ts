import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1668415095983 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "store"."products"
        ADD "per_pcs_suffix" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
