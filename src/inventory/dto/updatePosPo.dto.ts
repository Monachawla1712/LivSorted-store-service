import {
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

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  poId: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
