import { EnvironmentVariables } from './env.validation';

export interface Config {
  appEnv: string;
  port: string;
  db_url: string;
  storeSearchRadiusInKms: number;
  internal_base_url: string;
  internal_token: string;
  rz_auth_key: string;
  warehouse_url: string;
  s3AccessKey: string;
  s3SecretAccessKey: string;
  s3BucketName: string;

  s3CloudFrontBaseUrl: string;
  default_timeout: number;
  cacheInvalidatedPassword: string;
}

export default (): Config => {
  const processEnv = process.env as unknown as EnvironmentVariables;
  return {
    appEnv: processEnv.ENV,
    port: processEnv.PORT || '3001',
    db_url: processEnv.DATABASE_URL,
    storeSearchRadiusInKms: processEnv.STORE_SEARCH_RADIUS_IN_KMS || 6,
    internal_base_url: processEnv.INTERNAL_BASE_URL,
    internal_token: processEnv.INTERNAL_TOKEN,
    rz_auth_key: processEnv.RZ_AUTH_KEY,
    warehouse_url: processEnv.WAREHOUSE_URL,
    s3AccessKey: processEnv.S3_ACCESS_KEY,
    s3SecretAccessKey: processEnv.S3_SECRET_ACCESS_KEY,
    s3BucketName: processEnv.S3_BUCKET_NAME,
    s3CloudFrontBaseUrl: processEnv.S3_CLOUDFRONT_BASE_URL,
    default_timeout:processEnv.DEFAULT_TIMEOUT || 10000,
    cacheInvalidatedPassword: processEnv.INVALIDATE_CACHE_PASSWORD,
  };
};
