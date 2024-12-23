import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1669199012838 implements MigrationInterface {
  name = 'storeService1669199012838';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."inventory_update_log"
            ALTER COLUMN "deducted_value" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "store"."inventory_update_log"
            ALTER COLUMN "from_inventory" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
