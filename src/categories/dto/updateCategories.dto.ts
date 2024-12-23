import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoriesDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image_url!: string;
}
