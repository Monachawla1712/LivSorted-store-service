export interface WarehouseSkuB2cBean {
  id: number;
  skuCode: string;
  whId: number;
  moq: number;
  grades: WhSkuGradeBean[];
  procurementCategory: string;
}

export interface WhSkuGradeBean {
  name: string;
  consumerBufferPerc: number;
  logisticBufferPerc: number;
  cratingBufferPerc: number;
  rtvBufferPerc: number;
  presetVendorId: number;
}
