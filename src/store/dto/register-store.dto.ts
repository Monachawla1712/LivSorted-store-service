import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';
export class RegisterStoreDto {
  @ApiProperty({
    description: 'name of store',
  })
  @IsOptional()
  @IsString()
  ownerName: string;

  @ApiProperty({
    description: 'name of store',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Address Line 1',
  })
  @IsOptional()
  @IsString()
  addressLine_1: string;

  @ApiProperty({
    description: 'Address Line 2',
  })
  @IsOptional()
  @IsString()
  addressLine_2?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  landmark: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  state: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  pincode: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  pocName: string;

  @IsOptional()
  @IsString()
  pocContactNo: string;

  @IsOptional()
  @IsString()
  open_time: string;

  @IsOptional()
  @IsString()
  close_time: string;
}
