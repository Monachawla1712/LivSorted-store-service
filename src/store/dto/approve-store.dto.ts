import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsNumber,
  IsString,
  IsOptional,
  Matches,
} from 'class-validator';
import { Geometry } from 'geojson';
import { GeoJSONFeatureCollection, GeoJSONGeometry } from './GeoJson.interface';
export class ApproveStoreDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: GeoJSONFeatureCollection | GeoJSONGeometry;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  boundry?: Geometry;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine_1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine_2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pincode?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lithos_ref?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  verificationStatus?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  whId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeDeliveryType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeSubtype?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salesPotential?: number;

  @IsOptional()
  @IsString()
  open_time: string;

  @IsOptional()
  @IsString()
  deliveryOpenTime: string;

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
  @IsString()
  pocName: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  pocContactNo: string;
}
