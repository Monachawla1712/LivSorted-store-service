import {
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryType } from '../enum/inventoryType.enum';

class ReceivedItemDto {
  @IsString()
  skuCode: string;

  @IsNumber()
  quantity: number;
}

export class InventoryReceptionDto {
  @IsEnum(InventoryType)
  to: InventoryType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivedItemDto)
  @IsNotEmpty({ each: true })
  receivedItems: ReceivedItemDto[];
}
