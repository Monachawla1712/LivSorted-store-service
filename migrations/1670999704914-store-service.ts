import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1670999704914 implements MigrationInterface {
  name = 'storeService1670999704914';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."products"
            ADD "product_description" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
