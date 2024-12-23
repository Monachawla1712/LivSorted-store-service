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

export class UpdateInventoryDto {
  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  market_price: number;

  @IsOptional()
  @IsNumber()
  sale_price: number;

  @IsOptional()
  @IsBoolean()
  is_active: boolean;

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
  @IsBoolean()
  is_complimentary: boolean;

  @IsOptional()
  @IsBoolean()
  is_ozone_washed_item: boolean;

  @IsOptional()
  @IsNumber()
  ozone_washing_charges: number;
}
