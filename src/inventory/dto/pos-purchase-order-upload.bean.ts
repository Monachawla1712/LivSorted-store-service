import { ErrorBean } from '../../common/dto/error.bean';

export class PosPurchaseOrderUploadBean {
  skuCode: string;
  receivedQty: number;
  rtv: number;
  costPrice: number;
  errors: ErrorBean[] = [];
  static getHeaderMapping() {
    return 'skuCode:Sku Code,receivedQty:Received Quantity,rtv:rtv,costPrice:Cost Price';
  }
}
