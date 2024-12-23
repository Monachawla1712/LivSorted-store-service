import {
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InventoryType } from '../enum/inventoryType.enum';

class MovementItemDTO {
  @IsString()
  skuCode: string;

  @IsNumber()
  quantity: number;
}

export class InventoryMovementDto {
  @IsEnum(InventoryType)
  from: InventoryType;

  @IsEnum(InventoryType)
  to: InventoryType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovementItemDTO)
  @IsNotEmpty({ each: true })
  movementList: MovementItemDTO[];
}
