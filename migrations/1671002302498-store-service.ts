import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1671002302498 implements MigrationInterface {
  name = 'storeService1671002302498';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."products" DROP COLUMN "product_description"
        `);
    await queryRunner.query(`
            ALTER TABLE "store"."products"
            ADD "packet_description" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
