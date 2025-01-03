import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  entities: ['src/**/entity/*.entity.ts'],
  migrations: ['migrations/*'],
  migrationsTableName: 'store.store_migration',
});
