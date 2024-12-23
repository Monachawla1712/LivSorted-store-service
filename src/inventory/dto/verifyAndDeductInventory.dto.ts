import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UpdateInventoryQuantityDataDto } from './updateInventoryQuantity.dto';

export class VerifyAndDeductInventory {
  @IsString()
  @ApiProperty()
  user_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ type: [UpdateInventoryQuantityDataDto] })
  @ArrayMinSize(1)
  @Type(() => UpdateInventoryQuantityDataDto)
  data: UpdateInventoryQuantityDataDto[];
}
