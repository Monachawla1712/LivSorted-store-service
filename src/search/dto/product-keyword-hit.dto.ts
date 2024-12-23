import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NewProductKeywordHitDto {
  @Expose()
  @IsString()
  @ApiProperty()
  productCode: string;

  @Expose()
  @IsString()
  @ApiProperty()
  keyword: string;
}
