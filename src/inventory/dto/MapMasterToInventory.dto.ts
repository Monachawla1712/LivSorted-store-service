import { IsArray, IsString } from 'class-validator';

export class MapMasterToInventoryDto {
  @IsArray()
  @IsString({ each: true })
  mapProductsIds: string[];

  @IsArray()
  @IsString({ each: true })
  unmapProductsIds: string[];
}
