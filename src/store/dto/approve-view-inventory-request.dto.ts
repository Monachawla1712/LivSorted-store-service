import { IsNumber } from 'class-validator';
import { InventoryViewRequestStatus } from '../enum/inventory-view-request-status.enum';
import { InventoryView } from '../enum/inventory-view.enum';
export class ApproveViewInventoryRequestDto {
  @IsNumber({}, { each: true })
  ids?: number[];

  @IsNumber()
  status?: InventoryViewRequestStatus;

  @IsNumber()
  inventoryViewStatus?: InventoryView;
}
