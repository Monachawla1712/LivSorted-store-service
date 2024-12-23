import { ProductMetadataDto } from './product-metadata.dto';

export class ProductListItemResponse {
  id: number = null;
  sku_code: string = null;
  category_id: number = null;
  category_name: string = null;
  name: string = null;
  image_url: string = null;
  unit_of_measurement: string = null;
  market_price: number = null;
  sale_price: number = null;
  is_mapped = false;
}
