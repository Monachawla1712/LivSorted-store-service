import {
  IsNotEmpty,
  IsDateString,
  ArrayMinSize,
  ValidateNested,
  IsString,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsString()
  skuCode: string;

  @IsNumber()
  @Min(0)
  receivedQty: number;

  @IsNumber()
  @Min(0)
  rtv: number;

  @IsNumber()
  @Min(0)
  finalQty: number;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Min(0)
  finalAmount: number;
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  poId: string;

  @IsNotEmpty()
  @IsDateString()
  orderDate: string;

  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
