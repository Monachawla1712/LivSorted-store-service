import {
  IsBoolean,
  IsObject,
  IsNumber,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GeoJSONFeatureCollection, GeoJSONGeometry } from './GeoJson.interface';

export class UpdateStoreFosDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  location: GeoJSONFeatureCollection | GeoJSONGeometry;

  @IsOptional()
  @IsString()
  addressLine_1: string;

  @IsOptional()
  @IsString()
  addressLine_2?: string;

  @IsOptional()
  @IsString()
  landmark: string | null;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsNumber()
  pincode: number;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  open_time: string;

  @IsOptional()
  @IsString()
  deliveryOpenTime: string;

  @IsOptional()
  @IsString()
  store_type: string;

  @IsOptional()
  @IsString()
  pocName: string;

  @IsOptional()
  @IsString()
  pocContactNo: string;

  @IsOptional()
  @IsBoolean()
  isUnloadingReqd: boolean;

  @IsOptional()
  @IsString()
  storeCategory: string;

  @IsOptional()
  @IsString()
  ownerName: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  close_time: string;

  @IsOptional()
  @IsNumber()
  isDeliveryEnabled: number;

  @IsOptional()
  @IsBoolean()
  collectCash: boolean;

  @IsOptional()
  @IsNumber()
  easebuzzVirtualAccountId: number;

  @IsOptional()
  @IsString()
  easebuzzQrCode: string;

  @IsOptional()
  @IsString({ each: true })
  storeImages: string[];

  @IsOptional()
  @IsString({ each: true })
  storeVideos: string[];

  @IsOptional()
  @IsString()
  storeLocationType: string;

  @IsOptional()
  @IsNumber()
  fetchLocationAccuracy: number;

  @IsOptional()
  @IsString()
  storeDeliveryType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeSubtype?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salesPotential?: number;
}
