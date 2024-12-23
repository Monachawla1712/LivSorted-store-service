import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PriceBracketDto } from './priceBracket.dto';
import { Grade } from '../../products/dto/consumerContents.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryDto {
  @IsNumber()
  quantity: number;

  @IsNumber()
  market_price: number;

  @IsNumber()
  sale_price: number;

  @IsString()
  sku_code: string;

  @IsBoolean()
  is_active: boolean;

  @IsBoolean()
  is_complimentary: boolean;

  @IsArray()
  stores: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @Type(() => PriceBracketDto)
  @ValidateNested({ each: true })
  price_brackets: PriceBracketDto[];

  @IsOptional()
  @IsArray()
  @Type(() => Grade)
  @ValidateNested({ each: true })
  grades: Grade[];

  @IsOptional()
  @IsString()
  procurement_category: string;

  @IsOptional()
  @IsNumber()
  moq: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  availability: number;

  @IsOptional()
  @IsString()
  cutoffTime: string;

  @IsOptional()
  @IsNumber()
  resetQty: number;

  @IsOptional()
  @IsBoolean()
  is_ozone_washed_item: boolean;

  @IsOptional()
  @IsNumber()
  ozone_washing_charges: number;
}
