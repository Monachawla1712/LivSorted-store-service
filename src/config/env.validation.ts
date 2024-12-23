import { InternalServerErrorException } from '@nestjs/common';
import { Expose, plainToClass } from 'class-transformer';
import { IsEnum, validateSync, IsNotEmpty } from 'class-validator';

export enum Environment {
  DEVELOPMENT = 'dev',
  PRODUCTION = 'prod',
}

export class EnvironmentVariables {
  @Expose()
  @IsEnum(Environment)
  ENV!: Environment;

  @Expose()
  PORT!: string;

  @IsNotEmpty()
  @Expose()
  DATABASE_URL!: string;

  @Expose()
  STORE_SEARCH_RADIUS_IN_KMS?: number;

  @Expose()
  INTERNAL_BASE_URL: string;

  @Expose()
  INTERNAL_TOKEN: string;

  @Expose()
  RZ_AUTH_KEY: string;

  @Expose()
  WAREHOUSE_URL: string;

  @Expose()
  S3_ACCESS_KEY: string;

  @Expose()
  S3_SECRET_ACCESS_KEY: string;

  @Expose()
  S3_BUCKET_NAME: string;

  @Expose()
  S3_CLOUDFRONT_BASE_URL: string;

  @Expose()
  DEBUG: string;
  
  @Expose()
  DEFAULT_TIMEOUT: number;

  @Expose()
  INVALIDATE_CACHE_PASSWORD: string;
}

export function validate(config: Record<string, unknown>) {
  const transformedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  });

  const errors = validateSync(transformedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new InternalServerErrorException(errors.toString());
  }

  return transformedConfig;
}
