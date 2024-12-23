import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Unit } from '../enum/unit.enum';
import { TagsDto } from './tags.dto';
import { PartnerContentsDto } from './partnerContents.dto';
import { HighlightType, Identifier, Origin } from './consumerContents.dto';
import { SecondaryUomDetailsDto } from './SecondaryUomDetails.dto';
import { GstInfoDto } from '../../inventory/dto/gstInfo.dto';
import { RepeatItemDto } from './repeat_item.dto';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  sku_code: string;

  @IsNumber()
  @ApiProperty()
  category_id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  image_url: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  per_pcs_weight: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  per_pcs_suffix: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  per_pcs_buffer: number;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ isArray: true, type: TagsDto })
  @Type(() => TagsDto)
  @ValidateNested({ each: true })
  tags: TagsDto[];

  @ApiProperty({ enum: Unit, enumName: 'Unit' })
  @IsString()
  @IsEnum(Unit)
  unit_of_measurement: Unit;

  @ApiProperty()
  @IsString()
  display_name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packet_description: string;

  @IsNumber()
  @ApiProperty()
  min_quantity: number;

  @IsNumber()
  @ApiProperty()
  max_quantity: number;

  @IsNumber()
  @ApiProperty()
  buffer_quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  is_active: boolean;

  @ApiProperty()
  @IsString()
  icon_url: string;

  @ApiProperty()
  @IsString()
  synonyms: string;

  @IsOptional()
  @IsArray()
  @Type(() => PartnerContentsDto)
  @ValidateNested({ each: true })
  partnerContents: PartnerContentsDto[];

  @IsOptional()
  @IsArray()
  @Type(() => SecondaryUomDetailsDto)
  @ValidateNested({ each: true })
  secondaryUomDetails: SecondaryUomDetailsDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  defaultUom: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  showToggleOnApp: boolean;

  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(1)
  videos: string[];

  @IsString({ each: true })
  classes: string[];

  @IsString({ each: true })
  @IsOptional()
  consumerClasses: string[];

  @IsOptional()
  @Type(() => Identifier)
  @ValidateNested()
  identifier: Identifier;

  @IsOptional()
  @IsString()
  farmerStory: string;

  @IsOptional()
  @IsString()
  procurementType: string;

  @IsOptional()
  @IsString()
  moreAboutMe: string;

  @IsOptional()
  @IsBoolean()
  enablePiecesRequest: boolean;

  @IsOptional()
  @Type(() => GstInfoDto)
  @ValidateNested()
  gst: GstInfoDto;

  @IsString()
  hsn: string;

  @IsString()
  @IsOptional()
  highlightType: HighlightType;

  @IsString()
  @IsOptional()
  shelfLife: string;

  @IsString()
  @IsOptional()
  productDetails: string;

  @IsString()
  @IsOptional()
  disclaimer: string;

  @IsOptional()
  @Type(() => Origin)
  origin: Origin;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @IsBoolean()
  showNearSign: boolean;

  @IsOptional()
  @IsBoolean()
  showMoreDetails: boolean;

  @IsOptional()
  @Type(() => RepeatItemDto)
  repeatItem: RepeatItemDto;

  @IsOptional()
  @IsNumber()
  otherAppPrice: number;

  @IsOptional()
  @IsBoolean()
  showFixedPrice: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  procurementTypeExpiry: Date;
}
