import {
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { StoreStatus } from '../enum/store.status';
export class VerifyStoreBackofficeDto {
  @IsNumber()
  verificationStatus?: StoreStatus;

  @IsOptional()
  @IsNumberString()
  duplicateStoreId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
