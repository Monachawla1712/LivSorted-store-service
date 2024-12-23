import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1670862883952 implements MigrationInterface {
  name = 'storeService1670862883952';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."products"
            ADD "enable_pieces_request" boolean NOT NULL DEFAULT false
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "store"."products" DROP COLUMN "enable_pieces_request"
        `);
  }
}
