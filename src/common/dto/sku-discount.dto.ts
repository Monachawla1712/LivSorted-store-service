import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiscountTypeEnum } from '../../inventory/enum/discountType.enum';

export class SkuDiscount {
  @IsString()
  skuCode: string;

  @IsNumber()
  discount: number;

  discountType: DiscountTypeEnum;

  @IsString()
  @IsOptional()
  replaceWithSkuCode?: string;

  @IsString()
  @IsOptional()
  procurementTag?: string;

  @IsNumber()
  @IsOptional()
  maxQuantity?: number;

  @IsDate()
  @IsOptional()
  procurementTagExpiry?: Date;

  @IsNumber()
  @IsOptional()
  displayQty?: number;

  isMaximumPrice?: boolean;
}