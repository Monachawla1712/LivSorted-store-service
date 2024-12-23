import { TagsDto } from './tags.dto';
import { Categories } from '../../categories/entity/categories.entity';
import { GstInfoDto } from '../../inventory/dto/gstInfo.dto';

export class ProductDetailsDto {
  id: number;

  sku_code: string;

  category: Categories;

  category_id: number;

  name: string;

  packet_description: string;

  image_url: string;
  tags: TagsDto[];

  serves1: number;

  is_active: boolean;

  unit_of_measurement: string;

  market_price: number;

  sale_price: number;

  per_pcs_weight: number;

  per_pcs_suffix: string;

  per_pcs_buffer: number;

  display_name: string;

  min_quantity: number;

  max_quantity: number;

  buffer_quantity: number;

  enablePiecesRequest: boolean;

  isCoinsRedeemable: number;

  lithos_ref: number;

  created_at: Date;

  updated_at: Date;

  updated_by: string;

  icon_url: string;

  synonyms: string;

  collection_tags: string[];

  gst: GstInfoDto;
}
