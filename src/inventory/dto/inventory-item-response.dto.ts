import { InventoryEntity } from '../entity/inventory.entity';
import { LabelPricingType } from "../enum/lable-pricing-type.enum";

export class InventoryItemResponse extends InventoryEntity {
  last_purchase: object = {};
  per_pcs_price: number = null;
  outOfStock: boolean = null;
  coinsGivenRatio: number = null;
  coinsPrice: number = null;
  isPromoted = false;
  synonyms: string;
  actualPricingLabel: string;
  soldAtPricingLabel: string;
  labelPricingType: LabelPricingType;
}
