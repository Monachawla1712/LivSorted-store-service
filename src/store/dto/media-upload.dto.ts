import { IsString } from 'class-validator';

export class MediaUploadDto {
  @IsString()
  prefix: string;

  @IsString()
  bucketName: string;
}
