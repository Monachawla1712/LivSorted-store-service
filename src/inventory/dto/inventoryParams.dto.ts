export class InventoryParams {
  isOtpEnabled: number;
  showOutOfStock: number;
  hiddenSkusSet: Set<string>;
  defaultSortingTag: string;
  sortingDirection: number;
  spToCoinsRatio: number;
  coinsGivenRatio: number;
  sortingTagsSet: Set<string>;
  filterTagsSet: Set<string>;
  actualPricingLabel: string;
  soldAtPricingLabel: string;
  forecastedAppVersion: string;
  fixedDisplayPriceSkus: Set<string>;
  maximumPriceAppVersion: string;
  repeatOrderVersion: string;
}
