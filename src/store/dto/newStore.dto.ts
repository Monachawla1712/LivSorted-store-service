import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Geometry } from 'geojson';

export class NewStoreDto {
  @Expose()
  @ApiProperty({
    description: 'id of store owner',
  })
  @IsUUID()
  ownerId: string;

  @Expose()
  @ApiProperty()
  @IsString()
  store_id: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: 'name of store',
  })
  name: string;

  @IsBoolean()
  @ApiProperty({
    description: 'is store active',
  })
  isActive: boolean;

  @IsBoolean()
  @ApiProperty({
    description: 'is store open',
  })
  is_open: boolean;

  @IsObject()
  @ApiProperty({
    description: 'Store location as geolocation geometry',
  })
  location: Geometry;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Store boundry as geolocation geometry',
  })
  boundry?: Geometry;

  @IsBoolean()
  @ApiProperty({
    description: 'Is store service bounded',
  })
  isBounded: boolean;

  @IsString()
  @ApiProperty({
    description: 'Address Line 1',
  })
  addressLine_1: string;

  @IsString()
  @ApiProperty({
    description: 'Address Line 2',
  })
  @IsOptional()
  addressLine_2?: string;

  @IsString()
  @ApiProperty()
  landmark: string | null;

  @IsString()
  @ApiProperty()
  city: string;

  @IsString()
  @ApiProperty()
  state: string;

  @IsNumber()
  @ApiProperty()
  pincode: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  min_eta: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  max_eta: number;

  @IsString()
  @ApiProperty()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  upiId?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  lithos_ref?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'store open timing',
  })
  open_time: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'store close timing',
  })
  close_time: string;

  @IsOptional()
  @ApiProperty()
  store_type: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'poc name',
  })
  pocName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'poc contact no.',
  })
  pocContactNo: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Cash collection',
  })
  collectCash: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'unloading Required',
  })
  isUnloadingReqd: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'store Category',
  })
  storeCategory: string;

  @IsOptional()
  @IsString()
  storeSubtype?: string;

  @IsOptional()
  @IsNumber()
  salesPotential?: number;
}
