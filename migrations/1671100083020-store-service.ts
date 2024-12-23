import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1671100083020 implements MigrationInterface {
  name = 'storeService1671100083020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "store"."zones"
            ADD "drop_point" geometry(Point, 4326)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
