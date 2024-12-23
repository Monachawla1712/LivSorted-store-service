import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class NearbyStoresDto {
  @IsOptional()
  @IsString()
  storeId: string;

  @IsOptional()
  @IsLatitude()
  lat: string;

  @IsOptional()
  @IsLongitude()
  long: string;
}
