import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1668667036870 implements MigrationInterface {
  name = 'storeService1668667036870';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "store"."inventory_update_log" (
                "id" SERIAL NOT NULL,
                "sku_code" character varying NOT NULL,
                "source" character varying NOT NULL,
                "store_id" character varying NOT NULL,
                "deducted_value" numeric(10, 3) NOT NULL,
                "current_inventory" numeric(10, 3) NOT NULL,
                "updated_inventory" numeric(10, 3) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_652f0161a7153af646892bd8d2c" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
