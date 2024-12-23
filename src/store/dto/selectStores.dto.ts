import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CordinatesDto {
  @Expose()
  @ApiProperty()
  @IsString()
  lat: string;

  @Expose()
  @ApiProperty()
  @IsString()
  long: string;
}

export class StoresNearMeDto {
  @Expose()
  @ApiProperty()
  @IsString()
  lat: string;

  @Expose()
  @ApiProperty()
  @IsString()
  long: string;

  @Expose()
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  range?: number;
}

export class StoresSearchDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeIds: string[];

  @IsOptional()
  @IsString()
  city: string;
}
