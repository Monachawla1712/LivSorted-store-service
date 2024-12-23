import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class TagsDto {
  @ApiProperty()
  @IsString()
  display_name!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  image_url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Exclude()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Exclude()
  type?: number;
}
