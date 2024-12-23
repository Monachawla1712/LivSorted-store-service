import {
  ArrayUnique,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {SkuDiscount} from "../../common/dto/sku-discount.dto";

export class SocietySkuDiscountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuDiscount)
  @ArrayUnique((item: SkuDiscount) => item.skuCode)
  skuDiscounts: SkuDiscount[];

  @IsNumber()
  defaultDiscount: number;
}
