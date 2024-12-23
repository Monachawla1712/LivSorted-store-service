import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InventoryEntity } from './entity/inventory.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CustomLogger } from '../common/custom-logger';
import { ParseResult } from '../common/dto/parse-result';
import { ErrorBean } from '../common/dto/error.bean';
import { PosPurchaseOrderUploadBean } from './dto/pos-purchase-order-upload.bean';
import { PurchaseOrderItemEntity } from './entity/purchase-order-item.entity';
import { PurchaseOrderEntity } from './entity/purchase-order.entity';
import { CommonService } from '../common/common.service';
import { PosPOCreationBean } from './dto/pos-po-creation.bean';
import { InventoryService } from './inventory.service';
import { PurchaseOrderStatus } from './enum/purchaseOrderStatus.enum';

@Injectable()
export class PosPurchaseOrderService {
  private readonly logger = new CustomLogger(PosPurchaseOrderService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    private inventoryService: InventoryService,
    private commonService: CommonService,
    private dataSource: DataSource,
  ) {}

  async validatePosPOSheetUpload(
    posPoUploadBeans: PosPurchaseOrderUploadBean[],
    storeId: string,
  ) {
    const posPOParseResults = new ParseResult<PosPurchaseOrderUploadBean>();
    const existingInventoryMap: Map<string, InventoryEntity> =
      await this.inventoryService.getExistingInventoryMapForStore(
        storeId,
        posPoUploadBeans.map((posPricingBean) => {
          return posPricingBean.skuCode;
        }),
      );
    const skuCodeSet = new Set<string>();
    for (const posPoRawBean of posPoUploadBeans) {
      if (posPoRawBean.skuCode == null) {
        posPoRawBean.errors.push(
          new ErrorBean('FIELD_ERROR', 'SKU code is mandatory.', 'skuCode'),
        );
      } else if (!existingInventoryMap.has(posPoRawBean.skuCode)) {
        posPoRawBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'SKU not found in inventory.',
            'skuCode',
          ),
        );
      } else if (skuCodeSet.has(posPoRawBean.skuCode)) {
        posPoRawBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Duplicate SKU found in the sheet.',
            'skuCode',
          ),
        );
      } else if (
        posPoRawBean.receivedQty != null &&
        (isNaN(posPoRawBean.receivedQty) ||
          Number(posPoRawBean.receivedQty) < 0)
      ) {
        posPoRawBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Received Qty is invalid.',
            'receivedQty',
          ),
        );
      } else if (
        posPoRawBean.rtv != null &&
        (isNaN(posPoRawBean.rtv) || Number(posPoRawBean.rtv) < 0)
      ) {
        posPoRawBean.errors.push(
          new ErrorBean('FIELD_ERROR', 'RTV is invalid.', 'rtv'),
        );
      } else if (
        posPoRawBean.costPrice != null &&
        (isNaN(posPoRawBean.costPrice) || Number(posPoRawBean.costPrice) < 0)
      ) {
        posPoRawBean.errors.push(
          new ErrorBean('FIELD_ERROR', 'Cost Price is invalid.', 'costPrice'),
        );
      } else {
        posPoRawBean.receivedQty = Number(posPoRawBean.receivedQty);
        posPoRawBean.rtv = Number(posPoRawBean.rtv);
        posPoRawBean.costPrice = Number(posPoRawBean.costPrice);
        skuCodeSet.add(posPoRawBean.skuCode);
      }
      if (posPoRawBean.errors.length == 0) {
        posPOParseResults.successRows.push(posPoRawBean);
      } else {
        posPOParseResults.failedRows.push(posPoRawBean);
      }
    }
    return posPOParseResults;
  }

  async savePosPurchaseOrder(
    posPoCreationBeanList: PosPOCreationBean[],
    storeId: string,
    poId,
    orderDate,
    userId: string,
  ) {
    let success = false;
    let purchaseOrder: PurchaseOrderEntity = null;
    const existingInventoryMap: Map<string, InventoryEntity> =
      await this.inventoryService.getExistingInventoryMapForStore(
        storeId,
        posPoCreationBeanList.map((posPOCreationBean) => {
          return posPOCreationBean.skuCode;
        }),
      );
    const receivedDate = this.commonService
      .getCurrentIstMomentDateTime()
      .toDate()
      .toISOString();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      purchaseOrder = PurchaseOrderEntity.createPurchaseOrderEntity(
        storeId,
        poId,
        orderDate,
        receivedDate,
        PurchaseOrderStatus.DRAFT,
        userId,
      );
      purchaseOrder = await queryRunner.manager.save(purchaseOrder);
      const poItems: PurchaseOrderItemEntity[] = [];
      for (const posPOCreationBean of posPoCreationBeanList) {
        const purchaseOrderItem =
          PurchaseOrderItemEntity.createPurchaseOrderItemEntity(
            purchaseOrder.id,
            posPOCreationBean.skuCode,
            existingInventoryMap.get(posPOCreationBean.skuCode).name,
            posPOCreationBean.receivedQty,
            posPOCreationBean.rtv,
            posPOCreationBean.finalQty,
            posPOCreationBean.costPrice,
            posPOCreationBean.finalAmount,
            userId,
          );
        poItems.push(purchaseOrderItem);
      }
      await queryRunner.manager.save(poItems);
      await queryRunner.commitTransaction();
      success = true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      success = false;
    } finally {
      await queryRunner.release();
    }
    return { success, purchaseOrder };
  }

  async getPurchaseOrderById(poId: number) {
    return await this.purchaseOrderRepository.findOne({
      where: {
        id: poId,
        active: 1,
        poItems: { active: 1 },
      },
      relations: ['poItems'],
    });
  }

  async getPoListByStoreId(storeId: number, page: number, limit: number) {
    const whereQuery: FindOptionsWhere<PurchaseOrderEntity> = {
      storeId: storeId,
      active: 1,
    };
    const [stores, total] = await this.purchaseOrderRepository.findAndCount({
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

  async updatePosPurchaseOrder(
    po: PurchaseOrderEntity,
    posPoUpdateMap: Map<string, PosPOCreationBean>,
    poId: string,
    userId: string,
  ) {
    let success = true;
    let purchaseOrder = null;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      po.poId = poId;
      po.modifiedBy = userId;
      const updatedItems: PurchaseOrderItemEntity[] = [];
      for (const poItem of po.poItems) {
        const updateItem = posPoUpdateMap.get(poItem.skuCode);
        poItem.receivedQty = updateItem.receivedQty;
        poItem.rtv = updateItem.rtv;
        poItem.finalQty = updateItem.finalQty;
        poItem.costPrice = updateItem.costPrice;
        poItem.finalAmount = updateItem.finalAmount;
        updatedItems.push(poItem);
      }
      await queryRunner.manager.save(updatedItems);
      await queryRunner.manager.save(po);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      success = false;
    } finally {
      await queryRunner.release();
    }
    purchaseOrder = po;
    return { success: success, purchaseOrder: purchaseOrder };
  }

  async save(purchaseOrder: PurchaseOrderEntity) {
    await this.purchaseOrderRepository.save(purchaseOrder);
  }
}
