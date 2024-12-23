export class InventoryMetadataDto {
  cutoffTime: string = null;
  nextDaySalePrice: number;
  nextDayMarketPrice: number;
  marketingSalePrice: number;
  isPreBook: boolean;
  preBookDate: string;
  isLimited: boolean;
  resetQty: number;
  displayQty: number;
  marketingDisplayQty: number;
  isOzoneWashedItem: boolean;
  ozoneWashingCharges: number;

  static createInventoryMetadataDto(
    resetQty: number,
    ozoneWashingCharges: number,
    cutoffTime?: string,
    isOzoneWashedItem?: boolean,
  ): InventoryMetadataDto {
    const inventoryMetadataDto = new InventoryMetadataDto();
    inventoryMetadataDto.cutoffTime = cutoffTime;
    inventoryMetadataDto.resetQty = resetQty;
    inventoryMetadataDto.isOzoneWashedItem = isOzoneWashedItem;
    inventoryMetadataDto.ozoneWashingCharges = ozoneWashingCharges;
    return inventoryMetadataDto;
  }
}
