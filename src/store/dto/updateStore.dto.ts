import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Geometry } from 'geojson';

export class UpdateStoreDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_open?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: Geometry;

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
  landmark?: string;

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

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'store open timing',
  })
  open_time: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'store close timing',
  })
  close_time: string;

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
  @IsString()
  @ApiProperty({
    description: 'store Category',
  })
  storeCategory: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  storeSubtype?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  salesPotential?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'delivery open time timing',
  })
  deliveryOpenTime: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'store location type',
  })
  storeLocationType: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'store delivery type',
  })
  storeDeliveryType: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;
}
