import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { InventoryViewRequestEntity } from './entity/inventory-view-request.entity';
import { InventoryViewRequestStatus } from './enum/inventory-view-request-status.enum';

@Injectable()
export class InventoryViewRequestService {
  private readonly logger = new Logger(InventoryViewRequestService.name);
  constructor(
    @InjectRepository(InventoryViewRequestEntity)
    private readonly inventoryViewRequestRepository: Repository<InventoryViewRequestEntity>,
  ) {}
  async getInventoryViewRequests(
    storeId: string,
    statuses: InventoryViewRequestStatus[],
    page: number,
    limit: number,
  ) {
    const whereQuery: FindOptionsWhere<InventoryViewRequestEntity> = {
      status: In(statuses),
      active: 1,
    };
    if (storeId !== null) {
      whereQuery.storeId = storeId;
    }
    const [stores, total] =
      await this.inventoryViewRequestRepository.findAndCount({
        where: whereQuery,
        skip: (page - 1) * limit,
        take: limit,
      });
    const totalPages = Math.ceil(total / limit);
    return {
      data: stores,
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Number(totalPages),
    };
  }

  async createInventotyViewRequest(storeId: string, userId: string) {
    const inventoryRequestEntity =
      InventoryViewRequestEntity.createInventoryRequestEntity(storeId, userId);
    return await this.inventoryViewRequestRepository.save(
      inventoryRequestEntity,
    );
  }

  async getPendingInventoryViewRequestsByIds(ids: number[]) {
    return await this.inventoryViewRequestRepository.find({
      where: {
        id: In(ids),
        status: InventoryViewRequestStatus.PENDING,
        active: 1,
      },
    });
  }

  async bulkSaveInventoryViewRequest(
    inventoryViewRequestList: InventoryViewRequestEntity[],
  ) {
    return await this.inventoryViewRequestRepository.save(
      inventoryViewRequestList,
    );
  }
}
