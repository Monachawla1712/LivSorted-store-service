import { ErrorBean } from '../../common/dto/error.bean';
import { DiscountTypeEnum } from '../enum/discountType.enum';

export class AudienceSkuUploadBean {
  audienceId: number;
  skuCode: string;
  discount: number;
  discountType: DiscountTypeEnum;
  procurementTag: string;
  maxQuantity: number;
  displayQty: number;
  replaceWithSkuCode: string;
  validDeliveryDate: Date;
  errors: ErrorBean[] = [];

  static getHeaderMapping() {
    return 'audienceId:Audience Id,skuCode:Sku Code,discount:Discount,discountType:Discount Type,' +
      'procurementTag:Procurement Tag,maxQuantity:Max Quantity,displayQty:Display Quantity,replaceWithSkuCode:Replace Sku Code';
  }
}