import { ErrorBean } from '../../common/dto/error.bean';
import { PricingType } from '../enum/pricingType.enum';

export class InventoryPricingUploadBean {
  skuCode: string;
  salePrice: number;
  marketPrice: number;
  pricingType: PricingType;
  displayQty: number;
  storeId: string;
  errors: ErrorBean[] = [];

  static getHeaderMapping() {
    return 'storeId:Store Id,skuCode:Sku Code,salePrice:Sale Price,marketPrice:Market Price,displayQty:Display Quantity';
  }
}
