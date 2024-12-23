import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Unit } from '../../products/enum/unit.enum';
import { Transform } from 'class-transformer';

export class CreatePosProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsNumber()
  category_id: number;

  @IsOptional()
  @IsString()
  image_url: string;

  @IsString()
  @IsEnum(Unit)
  unit_of_measurement: Unit;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  article_number?: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  market_price: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  sale_price: number;

  @IsOptional()
  @IsBoolean()
  is_price_update_allowed;
}
