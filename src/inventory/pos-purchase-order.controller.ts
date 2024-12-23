import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import { InventoryService } from './inventory.service';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CustomLogger } from '../common/custom-logger';
import { CommonService } from '../common/common.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseResult } from '../common/dto/parse-result';
import { PosPurchaseOrderUploadBean } from './dto/pos-purchase-order-upload.bean';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderItemDto,
} from './dto/createPosPurchaseOrder.dto';
import { PosPOCreationBean } from './dto/pos-po-creation.bean';
import { PurchaseOrderEntity } from './entity/purchase-order.entity';
import { PosPurchaseOrderService } from './pos-purchase-order.service';
import { InventoryUpdateType } from './enum/inventoryUpdateType.enum';
import { UpdatePurchaseOrderDto } from './dto/updatePosPo.dto';
import { PurchaseOrderStatus } from './enum/purchaseOrderStatus.enum';

@Controller()
@UseFilters(HttpExceptionFilter)
export class PosPurchaseOrderController {
  private readonly logger = new CustomLogger(PosPurchaseOrderController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private inventoryService: InventoryService,
    private commonService: CommonService,
    private posPurchaseOrderService: PosPurchaseOrderService,
  ) {}

  @Post('/pos/purchase-order/upload')
  @UseInterceptors(FileInterceptor('file'))
  async posPurchaseOrderSheetUpload(
    @UploadedFile() file,
    @Headers('userId') userId,
    @Headers('storeId') storeId,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const results = await this.commonService.readCsvData(file);
    const parsedData = this.parsePosPOSheetByHeaderMapping(results.data);
    const posPOUploadBean: ParseResult<PosPurchaseOrderUploadBean> =
      await this.posPurchaseOrderService.validatePosPOSheetUpload(
        parsedData,
        storeId,
      );
    posPOUploadBean.headerMapping =
      PosPurchaseOrderUploadBean.getHeaderMapping();
    if (posPOUploadBean.failedRows.length == 0) {
      const bulkUploadData = await this.commonService.createNewBulkUploadEntry(
        posPOUploadBean.successRows,
        'pos-purchase-order',
        userId,
      );
      posPOUploadBean.key = bulkUploadData.accessKey;
    }
    return posPOUploadBean;
  }

  private parsePosPOSheetByHeaderMapping(csvRows) {
    const posPurchaseOrderUploadBeans: PosPurchaseOrderUploadBean[] = [];
    const headerMap = this.commonService.getHeaderMap(
      PosPurchaseOrderUploadBean.getHeaderMapping(),
    );
    for (const csvRow of csvRows) {
      const processedRow = new PosPurchaseOrderUploadBean();
      for (const key of Object.keys(csvRow)) {
        if (headerMap.has(key)) {
          processedRow[headerMap.get(key)] = csvRow[key];
        }
      }
      posPurchaseOrderUploadBeans.push(processedRow);
    }
    return posPurchaseOrderUploadBeans;
  }

  @Post('/pos/purchase-order/upload/save')
  async posPurchaseOrderSheetUploadSave(
    @Headers('storeId') storeId: string,
    @Headers('userId') userId: string,
    @Query('key') key,
    @Query('cancel') cancel,
    @Query('orderDate') orderDate,
    @Body('poId') poId,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const bulkUploadData = await this.commonService.getBulkUploadEntryByKey(
      'pos-purchase-order',
      key,
    );
    if (bulkUploadData == null) {
      throw new HttpException(
        { message: 'No Bulk Upload data found for given key and module.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (cancel == null) {
      bulkUploadData.status = 1;
      await this.posPurchaseOrderService.savePosPurchaseOrder(
        this.convertPOUploadBeanToPOCreationBean(
          bulkUploadData.jsonData.data as PosPurchaseOrderUploadBean[],
        ),
        storeId,
        poId,
        orderDate,
        userId,
      );
      await this.commonService.saveBulkUploadData(bulkUploadData);
    } else if (cancel == 1) {
      bulkUploadData.status = 0;
      await this.commonService.saveBulkUploadData(bulkUploadData);
    } else {
      throw new HttpException(
        { message: 'Invalid input for cancel' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { success: true };
  }

  @Post('pos/purchase-order')
  async createPosPurchaseOrder(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Body() createPosPurchaseOrderDto: CreatePurchaseOrderDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const posPOCreationBeanList = this.convertPOBeanToCreationBean(
      createPosPurchaseOrderDto.items,
    );
    const result = await this.posPurchaseOrderService.savePosPurchaseOrder(
      posPOCreationBeanList,
      storeId,
      createPosPurchaseOrderDto.poId,
      createPosPurchaseOrderDto.orderDate,
      userId,
    );
    return { success: result.success, purchaseOrder: result.purchaseOrder };
  }

  private convertPOBeanToCreationBean(poItemsList: PurchaseOrderItemDto[]) {
    const posPOCreationBeans: PosPOCreationBean[] = [];
    for (const orderItemDto of poItemsList) {
      const posPOCreationBean = new PosPOCreationBean();
      posPOCreationBean.skuCode = orderItemDto.skuCode;
      posPOCreationBean.receivedQty = orderItemDto.receivedQty;
      posPOCreationBean.rtv = orderItemDto.rtv;
      posPOCreationBean.costPrice = orderItemDto.costPrice;
      posPOCreationBean.finalQty = orderItemDto.finalQty;
      posPOCreationBean.finalAmount = orderItemDto.finalAmount;
      posPOCreationBeans.push(posPOCreationBean);
    }
    return posPOCreationBeans;
  }

  private convertPOUploadBeanToPOCreationBean(
    posPOUploadBeanList: PosPurchaseOrderUploadBean[],
  ) {
    const posPOCreationBeans: PosPOCreationBean[] = [];
    for (const orderItemDto of posPOUploadBeanList) {
      const posPOCreationBean = new PosPOCreationBean();
      posPOCreationBean.skuCode = orderItemDto.skuCode;
      posPOCreationBean.receivedQty = orderItemDto.receivedQty;
      posPOCreationBean.rtv = orderItemDto.rtv;
      posPOCreationBean.costPrice = orderItemDto.costPrice;
      posPOCreationBean.finalQty = orderItemDto.receivedQty - orderItemDto.rtv;
      posPOCreationBean.finalAmount =
        posPOCreationBean.finalQty * posPOCreationBean.costPrice;
    }
    return posPOCreationBeans;
  }

  @Get('pos/purchase-order')
  async getStorePurchaseOrderList(
    @Headers('storeId') storeId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 100,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    return await this.posPurchaseOrderService.getPoListByStoreId(
      Number(storeId),
      page,
      limit,
    );
  }

  @Get('pos/purchase-order/:id')
  async getStorePOById(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Param('id') poId: number,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    return await this.posPurchaseOrderService.getPurchaseOrderById(poId);
  }

  @Put('pos/purchase-order/:id')
  async updatePurchaseOrderPos(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Param('id') poId: number,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const purchaseOrder =
      await this.posPurchaseOrderService.getPurchaseOrderById(poId);
    if (purchaseOrder == null) {
      throw new HttpException(
        { message: 'PO not found.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (String(purchaseOrder.storeId) != storeId) {
      throw new HttpException(
        { message: 'Purchase Order store and current store do not match.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const posPoUpdateMap = new Map(
      this.convertPOBeanToCreationBean(updatePurchaseOrderDto.items).map(
        (poCreationItem) => {
          return [poCreationItem.skuCode, poCreationItem];
        },
      ),
    );
    const result = await this.posPurchaseOrderService.updatePosPurchaseOrder(
      purchaseOrder,
      posPoUpdateMap,
      updatePurchaseOrderDto.poId,
      userId,
    );
    return { success: result.success, purchaseOrder: result.purchaseOrder };
  }

  @Post('pos/purchase-order/:id/close')
  async closeStorePurchaseOrder(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Param('id') poId: number,
    @Param('status') status: number,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const purchaseOrder: PurchaseOrderEntity =
      await this.posPurchaseOrderService.getPurchaseOrderById(poId);
    if (purchaseOrder.status != PurchaseOrderStatus.DRAFT) {
      throw new HttpException(
        { message: 'Purchase Order should be in draft state.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (String(purchaseOrder.storeId) != storeId) {
      throw new HttpException(
        { message: 'Purchase Order store and current store do not match.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    purchaseOrder.status = status;
    purchaseOrder.modifiedBy = userId;
    if (purchaseOrder.status == PurchaseOrderStatus.APPROVED) {
      const inventory =
        await this.inventoryService.getInventoryFromStoreIdAndSkuCodes(
          storeId,
          purchaseOrder.poItems.map((poItem) => {
            return poItem.skuCode;
          }),
        );
      await this.inventoryService.updateInventoryQuantityBulk(
        inventory,
        purchaseOrder.poItems.map((poItem) => {
          return {
            skuCode: poItem.skuCode,
            quantity: poItem.finalQty,
            source: 'GRN',
          };
        }),
        InventoryUpdateType.GRN,
        userId,
      );
    }
    await this.posPurchaseOrderService.save(purchaseOrder);
    return { success: true, message: 'Status updated successfully' };
  }
}
