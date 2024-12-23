import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Level } from '../enum/promotion.level.enum';

export class UpdatePromotionDto {
  @Expose()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  name?: string;

  @Expose()
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional()
  sku_codes?: [string];

  @Expose()
  @IsString()
  @IsEnum(Level)
  @IsOptional()
  @ApiPropertyOptional({ enum: Level })
  promotion_level?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  promotion_value?: string;

  @ApiPropertyOptional()
  @Expose()
  @IsString()
  @IsOptional()
  message?: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  is_active?: boolean;
}

export class NewPromotionDto {
  @Expose()
  @IsString()
  @ApiProperty()
  name: string;

  @Expose()
  @IsArray()
  @ApiProperty()
  sku_codes: [string];

  @Expose()
  @IsString()
  @IsEnum(Level)
  @ApiProperty({ enum: Level })
  promotion_level: string;

  @Expose()
  @IsString()
  @ApiProperty()
  promotion_value: string;

  @ApiProperty()
  @Expose()
  @IsString()
  message: string;
}
