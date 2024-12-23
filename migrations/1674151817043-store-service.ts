import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1672163744257 implements MigrationInterface {
  name = 'storeService1672163744257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."products"
            ADD "is_coins_redeemable" smallint DEFAULT '0'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."products" DROP COLUMN "is_coins_redeemable"
        `);
  }
}
