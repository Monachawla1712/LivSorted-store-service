import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1668669176365 implements MigrationInterface {
  name = 'storeService1668669176365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."stores"
            ADD "open_time" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "store"."stores"
            ADD "close_time" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
