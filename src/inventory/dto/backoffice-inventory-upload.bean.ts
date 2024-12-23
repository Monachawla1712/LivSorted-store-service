import { ErrorBean } from '../../common/dto/error.bean';
import { PriceBracketDto } from './priceBracket.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BackofficeInventoryUploadBean {
  skuCode: string;
  quantity: number;
  salePrice: number;
  marketPrice: number;
  priceBracketsString: string;
  errors: ErrorBean[] = [];
  priceBrackets: PriceBracketDto[];
  gradeName: string;
  consumerBufferPerc: number;
  logisticBufferPerc: number;
  rtvBufferPerc: number;
  cratingBufferPerc: number;
  procurement_category: string;
  moq: number;
  storeId: string;

  static getHeaderMapping() {
    return (
        'storeId:Store Id,skuCode:Sku Code,quantity:Quantity,salePrice:Sale Price,marketPrice:Market Price,priceBracketsString:Price Brackets,' +
        'gradeName:Grade Name,consumerBufferPerc:Consumer Buffer Percent,logisticBufferPerc:Logistic Buffer Percent,' +
        'rtvBufferPerc:RTV Buffer Percent,cratingBufferPerc:Crating Buffer Percent,procurement_category:Procurement Category,moq:MOQ'
    );
  }
}