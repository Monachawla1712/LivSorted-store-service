import { TagsDto } from './tags.dto';
import { PartnerContentsDto } from './partnerContents.dto';
import { SecondaryUomDetailsDto } from './SecondaryUomDetails.dto';
import { GstInfoDto } from '../../inventory/dto/gstInfo.dto';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepeatItemDto } from "./repeat_item.dto";

export class ProductMetadataDto {
  contents: TagsDto[] = [];
  @ApiProperty()
  @ApiPropertyOptional()
  @Exclude()
  collections: string[] = [];

  @ApiProperty()
  @ApiPropertyOptional()
  @Exclude()
  classes: string[] = [];
  @ApiProperty()
  @ApiPropertyOptional()
  @Exclude()
  partnerContents: PartnerContentsDto[] = [];
  secondaryUomDetails: SecondaryUomDetailsDto[];
  defaultUom: string;
  @ApiProperty()
  @ApiPropertyOptional()
  @Exclude()
  showToggleOnApp: boolean;

  @ApiProperty()
  @ApiPropertyOptional()
  @Exclude()
  gst: GstInfoDto;

  @ApiProperty()
  @ApiPropertyOptional()
  repeatItem: RepeatItemDto;

  @ApiProperty()
  @ApiPropertyOptional()
  showNearSign: boolean;

  @ApiProperty()
  @ApiPropertyOptional()
  showMoreDetails: boolean;

  @ApiPropertyOptional()
  @ApiProperty()
  otherAppPrice: number;

  @ApiPropertyOptional()
  @ApiProperty()
  showFixedPrice: boolean;
}
