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

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku_code: string;

  @IsNumber()
  @ApiPropertyOptional()
  @IsOptional()
  category_id: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image_url: string;

  @IsArray()
  @ApiPropertyOptional({ isArray: true, type: TagsDto })
  @IsOptional()
  @Type(() => TagsDto)
  @ValidateNested({ each: true })
  tags: TagsDto[];

  @ApiPropertyOptional({ enum: Unit, enumName: 'Unit' })
  @IsString()
  @IsEnum(Unit)
  @IsOptional()
  unit_of_measurement: Unit;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  display_name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  packet_description: string;

  @IsNumber()
  @ApiPropertyOptional()
  @IsOptional()
  min_quantity: number;

  @IsNumber()
  @ApiPropertyOptional()
  @IsOptional()
  max_quantity: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  per_pcs_weight: number;

  @IsString()
  @IsOptional()
  per_pcs_suffix: string;

  @IsNumber()
  @IsOptional()
  per_pcs_buffer: number;

  @IsNumber()
  @ApiPropertyOptional()
  @IsOptional()
  buffer_quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  is_active: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon_url: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  synonyms: string;

  @IsOptional()
  @IsArray()
  @Type(() => PartnerContentsDto)
  @ValidateNested({ each: true })
  partnerContents: PartnerContentsDto[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  defaultUom: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  showToggleOnApp: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => SecondaryUomDetailsDto)
  @ValidateNested({ each: true })
  secondaryUomDetails: SecondaryUomDetailsDto[];

  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(1)
  videos: string[];

  @IsOptional()
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
