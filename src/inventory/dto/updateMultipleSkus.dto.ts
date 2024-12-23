import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class UpdateMultipleSkus {
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  sale_price: number;
}

export class UpdateMultipleSkusDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ isArray: true, type: [UpdateMultipleSkus] })
  @ArrayMinSize(1)
  @Type(() => UpdateMultipleSkus)
  MultipleSkus: UpdateMultipleSkus[];
}
