export class UpdatePriceLogObject {
  skuCode: string;
  source: string;
  storeId: string;
  fromMarketPrice: number;
  toMarketPrice?: number;
  fromSalePrice?: number;
  toSalePrice?: number;
  createdBy: string;
  modifiedBy: string;
}
