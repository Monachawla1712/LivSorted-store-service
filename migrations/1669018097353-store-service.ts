import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1669018097353 implements MigrationInterface {
  name = 'storeService1669018097353';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."inventory_update_log" RENAME COLUMN current_inventory TO from_inventory
        `);
    await queryRunner.query(`
            ALTER TABLE "store"."inventory_update_log" RENAME COLUMN updated_inventory TO to_inventory
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
