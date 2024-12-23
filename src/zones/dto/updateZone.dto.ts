import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class UpdateZoneDto {
  @IsOptional()
  @ApiProperty()
  @IsString()
  name: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  storeId: string;

  @IsOptional()
  @ApiProperty()
  @IsNotEmpty()
  zonePolygon: any;

  @IsOptional()
  @ApiProperty()
  @IsNotEmpty()
  dropPoint: any;

  @IsOptional()
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
