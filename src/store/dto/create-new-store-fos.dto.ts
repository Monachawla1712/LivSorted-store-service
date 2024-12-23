import {
  IsBoolean,
  IsObject,
  IsNumber,
  IsString,
  IsOptional,
  Matches,
  Max,
} from 'class-validator';
import { GeoJSONFeatureCollection, GeoJSONGeometry } from './GeoJson.interface';

export class CreateNewStoreFosDto {
  @IsOptional()
  @IsString()
  ownerName: string;

  @IsString()
  name: string;

  @IsObject()
  location: GeoJSONFeatureCollection | GeoJSONGeometry;

  @IsString()
  addressLine_1: string;

  @IsOptional()
  @IsString()
  addressLine_2?: string;

  @IsOptional()
  @IsString()
  landmark: string | null;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsNumber()
  pincode: number;

  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  contactNumber?: string;

  @IsOptional()
  @IsString()
  open_time: string;

  @IsOptional()
  store_type: string;

  @IsOptional()
  @IsString()
  pocName: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  pocContactNo: string;

  @IsOptional()
  @IsBoolean()
  isUnloadingReqd: boolean;

  @IsOptional()
  @IsString()
  storeCategory: string;

  @IsOptional()
  @IsString({ each: true })
  storeImages: string[];

  @IsOptional()
  @IsString({ each: true })
  storeVideos: string[];

  @IsOptional()
  @IsString()
  deliveryOpenTime: string;

  @IsOptional()
  @IsString()
  storeLocationType: string;

  @IsOptional()
  @IsString()
  storeDeliveryType: string;

  @IsOptional()
  @IsNumber()
  fetchLocationAccuracy: number;

  @IsOptional()
  @IsString()
  storeSubtype?: string;

  @IsOptional()
  @IsNumber()
  @Max(99999999)
  salesPotential?: number;
}
