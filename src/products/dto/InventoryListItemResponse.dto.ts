export class InventoryListItemResponse {
  id: string = null;
  quantity: number = null;
  market_price: number = null;
  sale_price: number = null;
  sku_code: string = null;
  article_number: number = null;
  name: string = null;
  unit_of_measurement: string = null;
  category_id: number = null;
  category_name: string = null;
  image_url: string = null;
  classes: string[] = [];
  hold: number = null;
  dump: number = null;
  is_active: boolean = null;
}
