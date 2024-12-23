import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Unit } from '../../products/enum/unit.enum';

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
  @IsNumber()
  articleNumber: number;

  @IsNumber()
  market_price: number;

  @IsNumber()
  sale_price: number;
}
