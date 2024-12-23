import { MigrationInterface, QueryRunner } from 'typeorm';

export class storeService1671653847314 implements MigrationInterface {
  name = 'storeService1671653847314';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "store"."params" (
                "id" SERIAL NOT NULL,
                "param_key" character varying NOT NULL,
                "param_name" character varying NOT NULL,
                "param_value" character varying NOT NULL,
                "active" integer NOT NULL,
                "is_editable" integer NOT NULL,
                "is_public" integer NOT NULL,
                CONSTRAINT "PK_54f49c25753910452dedc4df0f0" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
