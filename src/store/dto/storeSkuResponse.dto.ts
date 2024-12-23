import { PartnerContentsDto } from '../../products/dto/partnerContents.dto';

export class SkuBean {
  id: number;
  skuCode: string;
  name: string;
  image: string;
  unit_of_measurement: string;
  category: string;
  hsn: string | null;
  metadata: any | null;
  whId: number;
  moq: number;
  salePrice: number;
  markedPrice: number;
  marginDiscount: number | null;
  permissibleRefundQuantity: number | null;
  oos: number;
  maxOrderQty: number;
  classes: string[];
  priceBrackets: PriceBracketBean[];
  partnerContents: PartnerContentsDto[];
  startOrderQty: number;
  videos: string[] = null;
}

export class PriceBracketBean {
  max: number;
  min: number;
  salePrice: number;
}

export class StoreSkuResponseDto {
  storeId: number;
  isSrpStore: number;
  skuBeans: SkuBean[];
  inventoryView: string;
  isRequested = 0;
}
