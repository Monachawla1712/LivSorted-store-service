import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1670957022794 implements MigrationInterface {
  name = 'storeService1670957022794';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "store"."zones" (
                "id" character varying NOT NULL,
                "store_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "is_active" boolean NOT NULL DEFAULT false,
                "zone_polygon" geometry(Polygon, 4326),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_880484a43ca311707b05895bd4a" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
