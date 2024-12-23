import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1670310534995 implements MigrationInterface {
  name = 'storeService1670310534995';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."products"
            ADD "icon_url" character varying NOT NULL Default 'UPDATE ICON'
        `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
