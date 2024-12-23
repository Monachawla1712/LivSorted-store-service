import { IsNumber } from 'class-validator';

export class PriceBracketDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;

  @IsNumber()
  sale_price: number;

  @IsNumber()
  discount_percentage: number = 0;

  static createPriceBracket(
    min: number,
    max: number,
    salePrice: number,
    discountPercent,
  ) {
    const priceBracket = new PriceBracketDto();
    priceBracket.min = min;
    priceBracket.max = max;
    priceBracket.sale_price = salePrice;
    priceBracket.discount_percentage = discountPercent;
    return priceBracket;
  }
}
