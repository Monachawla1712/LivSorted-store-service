import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Unit } from '../../products/enum/unit.enum';
import { Transform } from 'class-transformer';

export class UpdatePosInventoryDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  category_id: number;

  @IsOptional()
  @IsString()
  image_url: string;

  @IsOptional()
  @IsString()
  @IsEnum(Unit)
  unit_of_measurement: Unit;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  article_number?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  market_price: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  sale_price: number;

  @IsOptional()
  @IsBoolean()
  is_price_update_allowed: boolean;

  @IsOptional()
  @IsBoolean()
  is_active: boolean;
}
