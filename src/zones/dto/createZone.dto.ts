import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
export class CreateZoneDto {
  @Expose()
  @ApiProperty()
  @IsString()
  name: string;

  @Expose()
  @ApiProperty()
  @IsString()
  storeId: string;

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  zonePolygon: any;

  @Expose()
  @ApiProperty()
  @IsNotEmpty()
  dropPoint: any;

  @Expose()
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
