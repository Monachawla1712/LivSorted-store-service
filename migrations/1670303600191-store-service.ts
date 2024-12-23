import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1670303600191 implements MigrationInterface {
  name = 'storeService1670303600191';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."stores"
            ADD "store_type" character varying NOT NULL DEFAULT 'DEFAULT'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
