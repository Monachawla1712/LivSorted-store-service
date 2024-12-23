import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInventoryQuantityDataDto {
  @ApiProperty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsString()
  sku_code!: string;
}

export class UpdateInventoryQuantityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ type: [UpdateInventoryQuantityDataDto] })
  @ArrayMinSize(1)
  @Type(() => UpdateInventoryQuantityDataDto)
  data: UpdateInventoryQuantityDataDto[];
}
