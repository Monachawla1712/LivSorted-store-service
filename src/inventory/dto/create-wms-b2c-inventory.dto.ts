export class CreateWmsB2cInventoryDto {
  skuCode: string;
  grades: WarehouseSkuGrade[];
  procurementCategory: string;
  moq: number;
}

export class WarehouseSkuGrade {
  name: string;
  consumerBufferPerc: number;
  logisticBufferPerc: number;
  rtvBufferPerc: number;
  cratingBufferPerc: number;
}
