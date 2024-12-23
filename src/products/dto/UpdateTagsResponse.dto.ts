import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { UpdateProductTagsDto } from './updateProductTags.dto';

export class UpdateTagsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ isArray: true, type: [UpdateProductTagsDto] })
  @Type(() => UpdateProductTagsDto)
  data: any;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ isArray: true, type: [String] })
  @Type(() => String)
  errors: any;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ isArray: true, type: [String] })
  @Type(() => String)
  meta: any;
}
