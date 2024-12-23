import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateInventoryDto } from './dto/createInventory.dto';
import { InventoryEntity } from './entity/inventory.entity';
import { UpdateInventoryDto } from './dto/updateInventory.dto';
import { UpdateMultipleSkusDto } from './dto/updateMultipleSkus.dto';
import { UpdateInventoryQuantityDataDto } from './dto/updateInventoryQuantity.dto';
import { xlsx } from 'src/common/xlsxToJson.helper';
import { validate } from 'class-validator';
import { InventoryUpdateLogService } from './inventory-update-log.service';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreParamsService } from '../store-params/store-params.service';
import { ProductsService } from '../products/products.service';
import { PriceBracketDto } from './dto/priceBracket.dto';
import { InventoryParams } from './dto/inventoryParams.dto';
import { InventoryItemResponse } from './dto/inventory-item-response.dto';
import { RecommendationService } from './recommendation.service';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CustomLogger } from '../common/custom-logger';
import { UpdateLogObject } from './dto/update-log-object';
import { ProductEntity } from '../products/entity/products.entity';
import { InventoryProductCategoryDto } from './dto/inventory-product-category-response.dto';
import { InventoryPricingUploadBean } from './dto/inventory-pricing-upload.bean';
import { ParseResult } from '../common/dto/parse-result';
import { ErrorBean } from '../common/dto/error.bean';
import { PurchaseOrderEntity } from './entity/purchase-order.entity';
import { CommonService } from '../common/common.service';
import { InventoryUpdateLogEntity } from './entity/inventory-update-log.entity';
import { InventoryType } from './enum/inventoryType.enum';
import { InventoryUpdateType } from './enum/inventoryUpdateType.enum';
import { BackofficeInventoryUploadBean } from './dto/backoffice-inventory-upload.bean';
import { Grade } from '../products/dto/consumerContents.dto';
import { WarehouseSkuB2cBean } from './dto/warehouse-sku-b2c-bean';
import { CreateWmsB2cInventoryDto } from './dto/create-wms-b2c-inventory.dto';
import { CreateStoreWarehouseResponse } from '../store/dto/create-store-warehouse-response.dto';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/configuration';
import { InventoryMetadataDto } from './dto/inventory-metadata.dto';
import { InventoryUpdatePriceLogService } from './inventory-update-price-log.service';
import { InventoryUpdatePriceLogEntity } from './entity/inventory-update-price-entity';
import { UpdatePriceLogObject } from './dto/update-price-log-object';
import { StoreService } from '../store/store.service';
import * as process from 'process';
import { AudienceSkuDiscountEntity } from './entity/audience.sku.discount.entity';
import { PricingType } from './enum/pricingType.enum';
import { AudienceSkuUploadBean } from './dto/audience-sku-upload.bean';
import { SkuDiscount } from '../common/dto/sku-discount.dto';
import { InventoryDetailsUpdateLogEntity } from './entity/inventory-details-update-log.entity';
import { InventoryDetailsUpdateLogService } from './inventory-details-update.service';
import { DiscountTypeEnum } from './enum/discountType.enum';
import { RestApiService } from 'src/common/rest-api.service';
import { LocalCache } from 'src/common/utils/local-cache-utils';
import { CACHE_KEYS } from 'src/cache/cache-constants';
import {
  CATEGORIES,
  DURATION_IN_SECOND,
} from 'src/common/constants/common-constants';
import { LabelPricingType } from './enum/lable-pricing-type.enum';
import { SocietySkuDiscountEntity } from '../society/entity/society.sku.discount.entity';
import { SocietyExpiryDto } from './dto/society-expiry.dto';
import { MoreThan } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { Categories } from '../categories/entity/categories.entity';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new CustomLogger(InventoryService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    @InjectRepository(InventoryUpdatePriceLogEntity)
    private readonly inventoryUpdatePriceLogRepository: Repository<InventoryUpdatePriceLogEntity>,
    @InjectRepository(AudienceSkuDiscountEntity)
    private readonly audienceSkuDiscountRepository: Repository<AudienceSkuDiscountEntity>,
    @InjectRepository(SocietySkuDiscountEntity)
    private readonly societySkuDiscountRepository: Repository<SocietySkuDiscountEntity>,
    private inventoryUpdatePriceLogService: InventoryUpdatePriceLogService,
    private inventoryUpdateLogService: InventoryUpdateLogService,
    private inventoryDetailsUpdateLogService: InventoryDetailsUpdateLogService,
    private storeParamsService: StoreParamsService,
    private productsService: ProductsService,
    private recommendationService: RecommendationService,
    private commonService: CommonService,
    private storeService: StoreService,
    private dataSource: DataSource,
    private configService: ConfigService<Config, true>,
    private restApiService: RestApiService,
    private categoryService: CategoriesService,
  ) {}

  async createInventory(
    inventoryBody: CreateInventoryDto,
    whSkuInventory: WarehouseSkuB2cBean,
    updateWhSkus: boolean,
    userId: string,
    storeId: string,
  ) {
    let inventory: InventoryEntity = null;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      inventory = InventoryEntity.createNewInventoryEntry(
        storeId,
        inventoryBody.sku_code,
        inventoryBody.quantity,
        inventoryBody.price_brackets,
        null,
        inventoryBody.market_price,
        inventoryBody.sale_price,
        null,
        null,
        inventoryBody.grades,
        userId,
        inventoryBody.availability,
        inventoryBody.is_complimentary,
        InventoryMetadataDto.createInventoryMetadataDto(
          inventoryBody.resetQty ?? inventoryBody.quantity,
          inventoryBody.ozone_washing_charges,
          inventoryBody.cutoffTime,
          inventoryBody.is_ozone_washed_item,
        ),
      );
      if (updateWhSkus) {
        const createWmsB2cInventoryDto: CreateWmsB2cInventoryDto =
          this.buildSaveWhSkuInventoryData(inventoryBody, whSkuInventory);
        await this.saveWhSkuInventory(storeId, [
          createWmsB2cInventoryDto,
        ]);
      }
      this.cleanInventoryGrades(inventory);
      await queryRunner.manager.save(inventory);
      await queryRunner.commitTransaction();

      await this.updateInventoryTimeParam();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === '23503') {
        throw new HttpException(
          { message: 'store_id or sku_code not found.' },
          HttpStatus.NOT_FOUND,
        );
      } else if (err.code === '23505') {
        throw new HttpException(
          { message: `Sku is present in store:${storeId}.` },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          { message: 'something went wrong while saving inventory.' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } finally {
      await queryRunner.release();
    }
    if (inventory != null) {
      this.addSkuInSocietySkuDiscount(inventory, userId);
    }
    return inventory;
  }

  private buildSaveWhSkuInventoryData(
    whInventoryBuildDto: {
      sku_code: string;
      grades: Grade[];
      procurement_category: string;
      moq: number;
    },
    whSkuInventory: WarehouseSkuB2cBean,
  ) {
    let procurementCategory = null;
    if (whInventoryBuildDto.procurement_category != null) {
      procurementCategory = whInventoryBuildDto.procurement_category;
    } else if (whSkuInventory != null) {
      procurementCategory = whSkuInventory.procurementCategory;
    } else {
      procurementCategory = 'Default';
    }
    const createWmsB2cInventoryDto: CreateWmsB2cInventoryDto = {
      skuCode: whInventoryBuildDto.sku_code,
      grades:
        whInventoryBuildDto.grades != null
          ? whInventoryBuildDto.grades
          : whSkuInventory
          ? whSkuInventory.grades
          : null,
      procurementCategory: procurementCategory,
      moq:
        whInventoryBuildDto.moq != null
          ? whInventoryBuildDto.moq
          : whSkuInventory
          ? whSkuInventory.moq
          : null,
    };
    return createWmsB2cInventoryDto;
  }

  private buildInventoryUpdatePriceData(
    updateInventoryBody: [{ market_price: number; sale_price: number }],
    inventory: InventoryEntity[],
    source: string,
  ) {
    let updatePriceLogObject: UpdatePriceLogObject[] = [];
    for (let i = 0; i < updateInventoryBody.length; i++) {
      let toMarketPrice = null;
      let toSalePrice = null;
      if (updateInventoryBody[i].market_price != null) {
        toMarketPrice = updateInventoryBody[i].market_price;
      }
      if (updateInventoryBody[i].sale_price != null) {
        toSalePrice = updateInventoryBody[i].sale_price;
      }
      updatePriceLogObject.push({
        skuCode: inventory[i].sku_code,
        source: source,
        storeId: inventory[i].store_id,
        fromMarketPrice: toMarketPrice ? inventory[i].market_price : null,
        toMarketPrice: toMarketPrice,
        fromSalePrice: toSalePrice ? inventory[i].sale_price : null,
        toSalePrice: toSalePrice,
        createdBy: inventory[i].updated_by,
        modifiedBy: inventory[i].updated_by,
      });
    }
    return updatePriceLogObject;
  }

  async updateInventoryQuantity(
    inventoryBody: UpdateInventoryQuantityDataDto[],
    store_id: string,
    updatedBy: string,
  ) {
    const skuCodes = inventoryBody.map((inventory) => inventory.sku_code);
    const inventoryList: InventoryEntity[] =
      await this.inventoryRepository.find({
        where: { sku_code: In(skuCodes) },
      });
    const inventoryMap = new Map(
      inventoryList.map((inventory) => {
        return [inventory.sku_code, inventory];
      }),
    );
    // update quantity to zero
    await this.inventoryRepository
      .createQueryBuilder()
      .update({ quantity: 0 })
      .where({ store_id })
      .execute();

    const arr = [];
    for (let a = 0; a < inventoryBody.length; a++) {
      if (inventoryBody[a].quantity <= 0) {
        arr.push({
          sku_code: inventoryBody[a].sku_code,
          code: 'INVALID_UPDATE_INVENTORY_QUANTITY',
        });
        continue;
      }
      const inventoryItem = inventoryMap.get(inventoryBody[a].sku_code);
      const availableItem = await this.validateAvailableQty(
        inventoryItem,
        inventoryBody[a].quantity,
      );
      if (!availableItem) {
        arr.push({
          sku_code: inventoryBody[a].sku_code,
          code: 'INVALID_UPDATE_INVENTORY_QUANTITY: cart qty is greater than update qty',
        });
        continue;
      }
      const inventory = await this.inventoryRepository
        .createQueryBuilder()
        .update({
          total_quantity: inventoryBody[a].quantity,
          quantity: availableItem.quantity,
          metadata: availableItem.metadata,
        })
        .where({
          sku_code: inventoryBody[a].sku_code,
          store_id,
        })
        .returning('*')
        .execute();

      await this.updateInventoryTimeParam();
      try {
        await this.inventoryUpdateLogService.insertLogObject({
          skuCode: inventoryBody[a].sku_code,
          source: 'Update by Warehouse',
          storeId: store_id,
          toInventory: inventoryBody[a].quantity.toFixed(3),
          createdBy: updatedBy,
          modifiedBy: updatedBy,
        });
      } catch (e) {
        this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong while inserting inventory log for updateInventoryDto : ' +
            JSON.stringify(inventoryBody),
          e,
        );
      }

      if (!inventory.raw[0]) {
        arr.push({
          sku_code: inventoryBody[a].sku_code,
          code: 'INVENTORY_NOT_FOUND_IN_STORE',
        });
      }
    }
    return { success: true, errors: arr };
  }

  async insertInventoryPriceLog(inventoryBody: UpdatePriceLogObject[]) {
    const arr = [];
    for (let a = 0; a < inventoryBody.length; a++) {
      try {
        await this.inventoryUpdatePriceLogService.insertPriceLogObject(
          inventoryBody[a],
        );
      } catch (e) {
        this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong while inserting inventory update price log for UpdateInventoryPriceDataDto : ' +
            JSON.stringify(inventoryBody),
          e,
        );
      }
    }
    return { success: true, errors: arr };
  }

  async getAllInventoryByAdmin(storeId: string) {
    return await this.inventoryRepository.find({
      where: {
        store_id: storeId,
      },
      relations: ['product', 'product.category'],
    });
  }

  async getAllInventoryByWhIdAdmin(whId: string) {
    let storeList = await this.getWhStores(whId);
    let inventories = await this.inventoryRepository.find({
      where: {
        store_id: In(storeList),
      },
      relations: ['product', 'product.category'],
    });
    const skuStoreMap: Map<string, Map<string, boolean>> = new Map();
    inventories.forEach((inventory) => {
      if (!skuStoreMap.has(inventory.sku_code)) {
        skuStoreMap.set(inventory.sku_code, new Map<string, boolean>());
      }
      skuStoreMap
        .get(inventory.sku_code)
        .set(inventory.store_id, inventory.is_active);
    });
    const res = new Map(
      inventories.map((inventory) => [
        inventory.sku_code,
        {
          inventory,
          store_activity: Object.fromEntries(
            skuStoreMap.get(inventory.sku_code),
          ),
        },
      ]),
    );
    return Array.from(res.values());
  }

  async getDefaultInventoryFromStoreId(storeId: string) {
    if (!storeId) {
      storeId = await this.storeParamsService.getStringParamValue(
        'DEFAULT_STORE_ID',
        '10001',
      );
    }
    const defaultInventory = await this.inventoryRepository.find({
      where: {
        store_id: storeId,
        is_active: true,
        is_complimentary: false,
        product: { is_active: true, sku_type: 'DEFAULT' },
      },
      relations: ['product', 'product.category'],
      order: {
        product: {
          name: 'ASC',
        },
      },
    });

    const specialItemIndex = defaultInventory.findIndex(
      (item) => item.sku_code === 'ST3999',
    );
    if (specialItemIndex > -1) {
      const [specialItem] = defaultInventory.splice(specialItemIndex, 1);
      defaultInventory.unshift(specialItem);
    }
    const defaultCount = await this.storeParamsService.getNumberParamValue(
      'IDENTIFIER_COUNT',
      1,
    );
    const identifierCount = defaultInventory.reduce((count, item) => {
      const name = item.product.consumer_contents.identifier?.name;
      count[name] = (count[name] || 0) + 1;
      return count;
    }, {});

    // Update the inventory to set identifier to null if its count is less than or equal to default count
    const updatedInventory = defaultInventory.map((item) => {
      const name = item.product.consumer_contents.identifier?.name;
      if (identifierCount[name] <= defaultCount) {
        item.product.consumer_contents.identifier = null;
      }
      return item;
    });
    return updatedInventory;
  }

  async getAllDefaultInventoryFromStoreId(storeId: string) {
    return await this.inventoryRepository.find({
      where: {
        store_id: storeId,
        product: { is_active: true, sku_type: 'DEFAULT' },
      },
      relations: ['product', 'product.category'],
      order: {
        product: {
          name: 'ASC',
        },
      },
    });
  }

  async getInventory(
    storeId: string,
    skuCodes: string[],
    format: boolean,
    userId: string,
    appVersion: string,
  ) {
    const skusPresent = {};
    if (skuCodes && skuCodes.length) {
      skusPresent['sku_code'] = In(skuCodes);
    }
    const inventory = (
      await this.inventoryRepository.find({
        where: {
          ...skusPresent,
          store_id: storeId,
          is_active: true,
          product: { is_active: true, sku_type: 'DEFAULT' },
        },
        relations: ['product', 'product.category'],
      })
    ).filter((item) => item.product !== null && item.product.category !== null);
    const {
      societySkuDiscountMap,
      audienceSkuDiscountMap,
      societyDefaultDiscount,
      replaceWithSkuMap,
    } = await this.handleDiscountedPrices(userId, null);
    const replaceSkuSet = new Set(replaceWithSkuMap.values());
    inventory.forEach((i) => {
      if (replaceSkuSet.has(i.sku_code)) {
        i.is_complimentary = false;
      } else {
        this.assignNewSalePrice(
          societySkuDiscountMap,
          audienceSkuDiscountMap,
          societyDefaultDiscount,
          i,
        );
      }
    });

    if (!format) {
      return inventory;
    }
    const isAllCategoryVersion = await this.isAllCategoryVersion(appVersion);
    const categories = await this.getCategoryResponse(storeId, isAllCategoryVersion);
    let isDairyVisible = this.isDairyCategoryVisible(categories);
    return {
      inventory: inventory.map((entity) => {
        const consumerContents = entity.product.consumer_contents;
        if (
          consumerContents &&
          (consumerContents.procurementTypeExpiry == null ||
            new Date(consumerContents.procurementTypeExpiry) < new Date() ||
            consumerContents.procurementType == null ||
            consumerContents.procurementType.trim() === '')
        ) {
          consumerContents.procurementType = null;
          consumerContents.highlightType = null;
        }
        if (!isAllCategoryVersion) {
          this.updateProductConsumerClasses(entity.product, isDairyVisible);
        }
        const inv: InventoryProductCategoryDto = {
          inventory_id: entity.id,
          inventory_quantity: entity.quantity,
          inventory_market_price: entity.market_price,
          inventory_sale_price: entity.sale_price,
          inventory_max_price: entity.max_price,
          inventory_sku_code: entity.sku_code,
          inventory_price_brackets: entity.price_brackets,
          inventory_store_id: entity.store_id,
          inventory_grades: entity.grades,
          inventory_created_at: entity.created_at,
          inventory_updated_at: entity.updated_at,
          inventory_updated_by: entity.updated_by,
          inventory_availability: entity.availability,
          inventory_cutoff_time: entity.metadata.cutoffTime,
          inventory_is_ozone_washed_item: entity.metadata.isOzoneWashedItem,
          inventory_ozone_washing_charges: entity.metadata.ozoneWashingCharges,
          product_id: entity.product.id,
          product_sku_code: entity.product.sku_code,
          product_hsn: entity.product.hsn,
          product_category_id: entity.product.category_id,
          product_name: entity.product.name,
          product_packet_description: entity.product.packet_description,
          product_image_url: entity.product.image_url,
          product_tags: entity.product.metadata.contents,
          product_serves1: entity.product.serves1,
          product_is_active: entity.product.is_active,
          product_unit_of_measurement: entity.product.unit_of_measurement,
          product_market_price: entity.product.market_price,
          product_sale_price: entity.product.sale_price,
          product_per_pcs_suffix: entity.product.per_pcs_suffix,
          product_display_name: entity.product.display_name,
          product_min_quantity: entity.product.min_quantity,
          product_max_quantity: entity.product.max_quantity,
          product_buffer_quantity: entity.product.buffer_quantity,
          product_per_pcs_weight: entity.product.per_pcs_weight,
          product_is_coins_redeemable: entity.product.isCoinsRedeemable,
          product_consumer_contents: entity.product.consumer_contents,
          product_created_at: entity.product.created_at,
          product_updated_at: entity.product.updated_at,
          product_updated_by: entity.product.updated_by,
          product_gst: entity.product.metadata.gst,
          category_id: entity.product.category.id,
          category_name: entity.product.category.name,
          category_image_url: entity.product.category.image_url,
          category_created_at: entity.product.category.createdAt,
          category_is_active: entity.product.category.is_active,
          category_updated_at: entity.product.category.updated_at,
          category_updated_by: entity.product.category.updated_by,
          is_complimentary: entity.is_complimentary,
          isPreBook: entity.metadata.isPreBook,
          preBookDate: entity.metadata.preBookDate,
        };
        return inv;
      }),
    };
  }

  async updateInventory(
    inventoryDetails: InventoryEntity,
    inventory: InventoryEntity,
    whSkuInventory: WarehouseSkuB2cBean,
    inventoryBody: UpdateInventoryDto,
  ) {
    try {
      this.cleanInventoryGrades(inventory);
      await this.inventoryRepository.save(inventory);
      await this.updateInventoryTimeParam();
      await this.addInventoryUpdateLogs(inventoryDetails, inventory);
      const createWmsB2cInventoryDto: CreateWmsB2cInventoryDto =
        this.buildSaveWhSkuInventoryData(
          { sku_code: inventory.sku_code, ...inventoryBody },
          whSkuInventory,
        );
      await this.saveWhSkuInventory(inventory.store_id, [
        createWmsB2cInventoryDto,
      ]);
      /* try {
        await this.inventoryUpdateLogService.insertLogObject({
          sku_code: inventory.sku_code,
          source: 'Update by Backoffice',
          store_id: inventory.store_id,
          to_inventory: inventoryBody.quantity.toFixed(3),
        });
      } catch (e) {
        this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong while inserting inventory log for updateInventoryDto : ' +
            JSON.stringify(inventoryBody),
          e,
        );
      }*/
      await this.insertUpdatePriceLogs(
        {
          marketPrice: inventoryBody.market_price,
          salePrice: inventoryBody.sale_price,
        },
        inventoryDetails,
        'update-api',
      );
      await this.updateInventoryTimeParam();
      return inventory;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while updating inventory log for updateInventoryDto : ' +
          JSON.stringify(inventoryBody) +
          ' inventory id : ' +
          inventory.id,
        e,
      );
      if (e.code === '23503') {
        throw new HttpException(
          { message: 'store_id or sku_code not found' },
          HttpStatus.NOT_FOUND,
        );
      } else if (e.code === '23505') {
        throw new HttpException(
          { message: 'duplicate store_id and sku_code not allow' },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw e;
      }
    }
  }

  async verifyAndDeduct(
    inventoryBody: { quantity: number; sku_code: string }[],
    user_id: string,
    storeId: string,
  ) {
    const notFound = [];
    const temp = {};
    const recommendationArr = [];

    const reqObj = {};
    inventoryBody.map((el) => {
      recommendationArr.push({
        user_id: user_id,
        quantity: el.quantity,
        sku_code: el.sku_code,
      });
      reqObj[el.sku_code] = { quantity: el.quantity, sku_code: el.sku_code };
    });

    const reqBodySkus = Object.keys(reqObj);

    const inventory = await this.inventoryRepository.find({
      relations: ['product', 'product.category'],
      where: {
        store_id: storeId,
        sku_code: In(reqBodySkus),
      },
    });

    const inventorySkuArr = [];

    inventory.map((el) => {
      inventorySkuArr.push(el.sku_code);
      const updatedInventory = el.quantity - reqObj[el.sku_code].quantity;
      if (
        parseFloat(updatedInventory.toFixed(3)) <
        parseFloat(el.product.buffer_quantity.toFixed(3))
      ) {
        notFound.push({
          sku_code: el.sku_code,
          code: 'BELOW_BUFFER_QUANTITY',
          max_quantity: parseFloat(
            (el.quantity - el.product.buffer_quantity).toFixed(3),
          ),
        });
      }
      temp[el.sku_code] = { quantity: el.quantity };
    });

    inventoryBody.map((el) => {
      if (!inventorySkuArr.includes(el.sku_code)) {
        notFound.push({
          sku_code: el.sku_code,
          code: 'INVENTORY_NOT_FOUND_IN_STORE',
        });
      }
    });

    if (notFound.length) {
      return { success: false, errors: notFound };
    } else {
      // Update Inventory Quantity
      reqBodySkus.map(async (skuCode) => {
        const quantity = temp[skuCode].quantity - reqObj[skuCode].quantity;
        await this.inventoryRepository
          .createQueryBuilder()
          .update({ quantity: parseFloat(quantity.toFixed(3)) })
          .where({
            sku_code: skuCode,
            store_id: storeId,
          })
          .returning('*')
          .execute();
        await this.updateInventoryTimeParam();

        const updateLogObject: UpdateLogObject = {
          skuCode: skuCode,
          source: 'Verify and Deduct',
          storeId: storeId,
          updateQty: (-1 * reqObj[skuCode].quantity).toFixed(3),
          toInventory: quantity.toFixed(3),
          fromInventory: temp[skuCode].quantity.toFixed(3),
          createdBy: user_id,
          modifiedBy: user_id,
        };

        try {
          await this.inventoryUpdateLogService.insertLogObject(updateLogObject);
        } catch (e) {
          this.logger.error(
            this.asyncContext.get('traceId'),
            'Something went wrong while inserting inventory log for updateLogObject : ' +
              JSON.stringify(updateLogObject),
            e,
          );
        }
      });

      await this.recommendationService.upsertRecommendations(recommendationArr);
    }

    return { success: true };
  }

  async updateInventoryQuantityByAdmin(
    inventoryBody: UpdateInventoryQuantityDataDto[],
    store_id: string,
    updatedBy: string,
  ) {
    const reqBodyObj = {};
    const inventoryObj = {};
    const errors = [];
    inventoryBody.map((el) => {
      reqBodyObj[el.sku_code] = {
        sku_code: el.sku_code,
        quantity: el.quantity,
      };
    });

    const reqBodySkus = Object.keys(reqBodyObj);

    const inventory = await this.inventoryRepository.find({
      where: {
        store_id: store_id,
        sku_code: In(reqBodySkus),
      },
      select: ['sku_code', 'quantity', 'total_quantity'],
    });

    inventory.map((el) => {
      inventoryObj[el.sku_code] = {
        sku_code: el.sku_code,
        quantity: el.quantity,
      };
    });

    //TODO : skipping inventory creation for missing sku for now

    // if (reqBodySkus.length > Object.keys(inventoryObj).length) {
    //   const missingSkus = new Set();
    //   reqBodySkus.forEach((reqSku) => {
    //     if (!inventoryObj.hasOwnProperty(reqSku)) {
    //       missingSkus.add(reqSku);
    //     }
    //   });
    //   if (missingSkus.size > 0) {
    //     try {
    //       const createInvResponse = await this.createInventoryUsingProductInfo(
    //         [...missingSkus].join(','),
    //         store_id,
    //         updatedBy,
    //       );
    //       if (
    //         createInvResponse.hasOwnProperty('addedSkus') &&
    //         createInvResponse['addedSkus'].length > 0
    //       ) {
    //         createInvResponse['addedSkus'].forEach((skuCode) => {
    //           inventoryObj[skuCode] = {
    //             sku_code: skuCode,
    //             quantity: 0,
    //           };
    //         });
    //       }
    //     } catch (e) {
    //       errors.push({
    //         sku_code: [...missingSkus].join(','),
    //         code: 'COULD_NOT_CREATE_INVENTORY_IN_STORE',
    //       });
    //     }
    //   }
    // }

    reqBodySkus.map(async (skuCode) => {
      if (!inventoryObj[skuCode]) {
        errors.push({
          sku_code: skuCode,
          code: 'INVENTORY_NOT_FOUND_IN_STORE',
        });
      } else {
        const quantity = Math.max(
          inventoryObj[skuCode].quantity + reqBodyObj[skuCode].quantity,
          0,
        );

        await this.inventoryRepository
          .createQueryBuilder()
          .update({
            quantity: parseFloat(quantity.toFixed(3)),
            is_active: true,
          })
          .where({
            sku_code: inventoryObj[skuCode].sku_code,
            store_id,
          })
          .returning('*')
          .execute();
        await this.updateInventoryTimeParam();

        const updateLogObject: UpdateLogObject = {
          skuCode: skuCode,
          source: 'Add or Deduct',
          storeId: store_id,
          updateQty: reqBodyObj[skuCode].quantity.toFixed(3),
          fromInventory: inventoryObj[skuCode].quantity.toFixed(3),
          toInventory: quantity.toFixed(3),
          createdBy: updatedBy,
          modifiedBy: updatedBy,
        };

        try {
          await this.inventoryUpdateLogService.insertLogObject(updateLogObject);
        } catch (e) {
          this.logger.error(
            this.asyncContext.get('traceId'),
            'Something went wrong while inserting inventory log for updateLogObject : ' +
              JSON.stringify(updateLogObject),
            e,
          );
        }
      }
    });

    return { success: true, errors };
  }

  async updateInventoryQuantityByAdminForRelatedStores(
    inventoryBody: UpdateInventoryQuantityDataDto[],
    store_id: string,
    updatedBy: string,
  ) {
    const storeIds = await this.getAllRelatedStores(store_id);
    const allErrors = [];
    const successes = [];

    for (const currentStoreId of storeIds) {
      try {
        const result = await this.updateInventoryQuantityByAdmin(
          inventoryBody,
          currentStoreId,
          updatedBy,
        );
        if (result.success) {
          successes.push({ storeId: currentStoreId, ...result });
        }
        if (result.errors && result.errors.length > 0) {
          allErrors.push({ storeId: currentStoreId, errors: result.errors });
        }
      } catch (error) {
        allErrors.push({
          storeId: currentStoreId,
          errors: [{ code: 'UNEXPECTED_ERROR', message: error.message }],
        });
      }
    }
    return {
      success: successes.length > 0,
      errors: allErrors,
    };
  }

  async getAllRelatedStores(storeId: string): Promise<Set<string>> {
    const warehousesStores = await this.storeParamsService.getStringParamValue(
      'WAREHOUSE_STORES',
      '',
    );
    let res = new Set(
      warehousesStores.split('|').flatMap((ws) => {
        const [whId, storeIds] = ws.split(':');
        const storeArr = storeIds.split(',');
        return storeArr.includes(storeId) ? storeArr : [];
      }),
    );
    res.add(storeId);
    return res;
  }

  // Validate XLSX json data
  async validateData(
    data,
    createdBy,
  ): Promise<{ inventory: Array<UpdateInventoryDto>; err: Array<[]> }> {
    return new Promise((resolve) => {
      const err = [];
      const inventoryData = [];
      data.forEach((element) => {
        const inventory = new UpdateInventoryDto();
        if (element.store_id) {
          element.store_id = element.store_id.toString();
        }
        if (element.price_brackets) {
          element.price_brackets = JSON.parse(element.price_brackets);
        }
        element.updated_by = createdBy;
        delete element.id;
        delete element.updated_at;
        delete element.created_at;

        Object.assign(inventory, element);

        validate(inventory).then((errors) => {
          if (errors.length > 0) {
            const obj = { ...errors[0].target } as CreateInventoryDto;
            err.push({
              sku_code: obj.sku_code,
              store_id: obj.stores,
              error: errors[0].constraints,
            });
          } else {
            inventoryData.push(inventory);
          }
        });
      });

      resolve({ inventory: inventoryData, err });
    });
  }

  async xlsxBulkInventoryCreate(fileName: string, createdBy: string) {
    const xlsxData = await xlsx(fileName);

    const data: { inventory: UpdateInventoryDto[]; err: Array<[]> } =
      await this.validateData(xlsxData, createdBy);

    if (data.err[0]) {
      return { success: false, error: data.err };
    }

    const perChunk = 1000; // items per chunk

    const result = data.inventory.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / perChunk);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);

    for (let index = 0; index < result.length; index++) {
      const element = result[index];

      try {
        await this.inventoryRepository.upsert(element, {
          conflictPaths: ['sku_code', 'store_id'],
          skipUpdateIfNoValuesChanged: true,
        });
        await this.updateInventoryTimeParam();
      } catch (e) {
        if (e.code === '23503') {
          throw new HttpException({ message: e.detail }, HttpStatus.NOT_FOUND);
        }
        this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong while upserting inventory log for element : ' +
            JSON.stringify(element),
          e,
        );
        throw new HttpException(
          { message: 'Internal Server Error' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    return { success: true };
  }

  async updateMultipleSkus(
    updateMultipleSkus: UpdateMultipleSkusDto,
    updatedBy: string,
  ) {
    const errors = [];
    const skusData = updateMultipleSkus['MultipleSkus'];
    const ids = updateMultipleSkus.MultipleSkus.map((ele) => ele.id);
    const inventoryList: InventoryEntity[] =
      await this.inventoryRepository.find({
        where: { id: In(ids) },
      });
    const inventoryMap = new Map(
      inventoryList.map((inventory) => {
        return [inventory.sku_code, inventory];
      }),
    );
    for (const ele of skusData) {
      if (ele.quantity <= 0) {
        errors.push({
          id: ele.id,
          code: 'INVALID_UPDATE_INVENTORY_QUANTITY',
        });
        continue;
      }
      const inventoryItem = inventoryMap.get(ele.id);
      const availableItem = await this.validateAvailableQty(
        inventoryItem,
        ele.quantity,
      );
      if (!availableItem) {
        errors.push({
          id: ele.id,
          code: 'INVALID_UPDATE_INVENTORY_QUANTITY: cart qty is greater than inventory qty',
        });
        continue;
      }
      await this.inventoryRepository
        .createQueryBuilder()
        .update({
          total_quantity: ele.quantity,
          quantity: availableItem.quantity,
          metadata: availableItem.metadata,
          sale_price: ele.sale_price,
          updated_by: updatedBy,
        })
        .where({ id: ele.id })
        .returning('*')
        .execute();
      await this.updateInventoryTimeParam();
    }
    return {
      message: 'inventory updated successfully',
      success: true,
      errors: errors,
    };
  }

  async getSocietyDetailsById(societyId: string) {
    const warehouseURL = `${this.configService.get<string>(
      'warehouse_url',
    )}/api/v1/ppd/society/${societyId}`;
    try {
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': this.configService.get<string>('rz_auth_key'),
        },
      });
    } catch (e) {
      throw new HttpException(
        {
          message:
            'Something went wrong while fetching society details from Warehouse.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetInventory(storeId: string) {
    await this.updateInventoryTimeParam();
    return await this.inventoryRepository
      .createQueryBuilder()
      .update({ quantity: 0 })
      .where({ store_id: storeId })
      .execute();
  }

  // async createInventoryUsingProductInfo(
  //   skuCodes: string,
  //   storeId: string,
  //   updatedBy: string,
  // ) {
  //   const addedSkus = [];
  //   const errors = [];
  //   const products: ProductEntity[] = await this.productsService.getAllProduct({
  //     sku_code: skuCodes,
  //   });
  //   if (products != null && products.length > 0) {
  //     for (const product of products) {
  //       const priceBracketObj = new PriceBracketDto();
  //       priceBracketObj.min = product.min_quantity;
  //       priceBracketObj.max = product.max_quantity;
  //       priceBracketObj.sale_price = product.sale_price;
  //
  //       const createInventoryObj = new CreateInventoryDto();
  //       createInventoryObj.quantity = 0;
  //       createInventoryObj.is_active = true;
  //       createInventoryObj.sku_code = product.sku_code;
  //       createInventoryObj.sale_price = product.sale_price;
  //       createInventoryObj.store_id = storeId;
  //       createInventoryObj.market_price = product.market_price;
  //       createInventoryObj.price_brackets = [priceBracketObj];
  //
  //       try {
  //         await this.createInventory(
  //           createInventoryObj,
  //           null,
  //           false,
  //           updatedBy,
  //         );
  //         addedSkus.push(product.sku_code);
  //       } catch (e) {
  //         errors.push({
  //           sku_code: product.sku_code,
  //           code: 'COULD_NOT_CREATE_INVENTORY_IN_STORE',
  //         });
  //       }
  //     }
  //   }
  //   return { addedSkus: addedSkus, errors: errors };
  // }

  async initInventoryParams() {
    let inventoryParams = LocalCache.getValue(CACHE_KEYS.InventoryParamsKey);
    if (inventoryParams) {
      // json.stringify converts sets to objects. So to make it work, we have converted sets to array and converting it back to sets.
      // This code will needs to be there wherever we are using sets in cache
      inventoryParams.hiddenSkusSet = new Set(
        inventoryParams.hiddenSkusSet ?? [],
      );
      inventoryParams.sortingTagsSet = new Set(
        inventoryParams.sortingTagsSet ?? [],
      );
      inventoryParams.filterTagsSet = new Set(
        inventoryParams.filterTagsSet ?? [],
      );
      inventoryParams.fixedDisplayPriceSkus = new Set(
        inventoryParams.fixedDisplayPriceSkus ?? [],
      );
      return inventoryParams;
    }
    inventoryParams = new InventoryParams();
    inventoryParams.isOtpEnabled = 0;
    inventoryParams.spToCoinsRatio = 0.5;
    inventoryParams.coinsGivenRatio = 0.5;
    if (inventoryParams.isOtpEnabled == 1) {
      inventoryParams.spToCoinsRatio =
        await this.storeParamsService.getNumberOrderParamValue(
          'SP_TO_COINS_RATIO',
          0.5,
        );
      inventoryParams.coinsGivenRatio =
        await this.storeParamsService.getNumberOrderParamValue(
          'COINS_GIVEN_RATIO',
          0.5,
        );
    }
    inventoryParams.showOutOfStock =
      await this.storeParamsService.getNumberParamValue('SHOW_OUT_OF_STOCK', 1);

    const hiddenSkus = (await this.storeParamsService.getJsonParamValue(
      'HIDDEN_SKUS_LIST',
      [],
    )) as string[];
    inventoryParams.hiddenSkusSet = new Set(hiddenSkus);
    inventoryParams.defaultSortingTag = 'VIBGYOR';
    inventoryParams.sortingDirection = 1;
    const sortingTagsList = [
      'Color',
      'Proteins',
      'Carbohydrate',
      'Fats',
      'Fiber',
      'Calories',
    ];
    inventoryParams.sortingTagsSet = new Set(sortingTagsList);
    const filterTagsList = ['Natural', 'Traditional'];
    inventoryParams.filterTagsSet = new Set(filterTagsList);
    inventoryParams.actualPricingLabel =
      await this.storeParamsService.getStringParamValue(
        'ACTUAL_PRICING_LABEL',
        '',
      );
    inventoryParams.soldAtPricingLabel =
      await this.storeParamsService.getStringParamValue(
        'SOLD_AT_PRICING_LABEL',
        '',
      );

    inventoryParams.forecastedAppVersion =
      await this.storeParamsService.getStringParamValue(
        'FORECASTED_APP_VERSION',
        '1.1.091',
      );

    inventoryParams.maximumPriceAppVersion =
      await this.storeParamsService.getStringParamValue(
        'MAXIMUM_PRICE_APP_VERSION',
        '1.1.099',
      );

    inventoryParams.repeatOrderVersion =
      await this.storeParamsService.getStringParamValue(
        'REPEAT_ORDER_APP_VERSION',
        '1.1.104',
      );

    const fixedDisplayPriceSkus =
      await this.storeParamsService.getStringParamValue(
        'FIXED_DISPLAY_PRICE_SKUS',
        '',
      );
    inventoryParams.fixedDisplayPriceSkus = new Set(
      fixedDisplayPriceSkus.split(','),
    );
    LocalCache.setValue(
      CACHE_KEYS.InventoryParamsKey,
      inventoryParams,
      DURATION_IN_SECOND.HR_8,
    );
    return inventoryParams;
  }

  async isUserEligibleForSocietyDiscount(userId: string) {
    if (userId == null) return false;
    let user = await this.storeService.getUserInternal(userId);
    let orderCountParam = await this.storeParamsService.getNumberParamValue(
      'MAX_ORDER_COUNT_FOR_SKU_DISCOUNT',
      5,
    );
    return user
      ? user.userPreferences == null ||
          user.userPreferences.orderCount == null ||
          user.userPreferences.orderCount < orderCountParam
      : false;
  }

  async getUserAddressInternal(userId) {
    try {
      return await this.restApiService.makeRequest({
        url: `${process.env.INTERNAL_BASE_URL}/auth/internal/addresses/user/${userId}`,
        params: {
          active: true,
        },
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching user address data for userId : ' +
          userId,
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSocietySkuDiscount(societyId: number) {
    return await this.commonService.getSocietySkuDiscountEntity(societyId);
  }

  calculateDiscountedSalePrice(
    salePrice: number,
    discountPercentage: number,
  ): number {
    const discountAmount = (salePrice * discountPercentage) / 100;
    return salePrice - Math.round(discountAmount);
  }

  assignNewSalePrice(
    societySkuDiscountMap: Map<string, SkuDiscount[]>,
    audienceSkuDiscountMap: Map<string, SkuDiscount[]>,
    societyDefaultDiscount: number,
    inventory: InventoryEntity,
  ) {
    let isFlatDiscountApplied = false;
    let isMaximumPrice = false;
    const originalSalePrice = inventory.sale_price;
    const originalMarketPrice = inventory.market_price;

    if (inventory.metadata.marketingSalePrice != null) {
      inventory.sale_price = inventory.metadata.marketingSalePrice;
    } else {
      let discountedSalePrice = originalSalePrice;
      let discountedMarketPrice = originalMarketPrice;

      const societyDiscounts = societySkuDiscountMap.get(inventory.sku_code);
      if (societyDiscounts != null && societyDiscounts.length > 0) {
        const maxPriceDiscount = societyDiscounts.find(
          (discount) => discount.isMaximumPrice === true,
        );
        if (maxPriceDiscount != null) {
          isMaximumPrice = true;
          inventory.max_price = maxPriceDiscount.discount;
        } else {
          const {
            discountedSalePrice: societySalePrice,
            discountedMarketPrice: societyMarketPrice,
            isFlatDiscountApplied: societyFlatDiscountApplied,
          } = this.applyDiscounts(
            originalSalePrice,
            originalMarketPrice,
            societyDiscounts,
            inventory
          );
          discountedSalePrice = Math.min(discountedSalePrice, societySalePrice);
          discountedMarketPrice = Math.min(
            discountedMarketPrice,
            societyMarketPrice,
          );
          isFlatDiscountApplied =
            isFlatDiscountApplied || societyFlatDiscountApplied;
        }
      } else if (societyDefaultDiscount != null && societyDefaultDiscount > 0) {
        discountedSalePrice = Math.min(
          discountedSalePrice,
          this.calculateDiscountedSalePrice(
            originalSalePrice,
            societyDefaultDiscount,
          ),
        );
        discountedMarketPrice = Math.min(
          discountedMarketPrice,
          this.calculateDiscountedSalePrice(
            originalMarketPrice,
            societyDefaultDiscount,
          ),
        );
      }

      const audienceDiscounts = audienceSkuDiscountMap.get(inventory.sku_code);
      if (audienceDiscounts != null && audienceDiscounts.length > 0) {
        const {
          discountedSalePrice: audienceSalePrice,
          discountedMarketPrice: audienceMarketPrice,
          isFlatDiscountApplied: audienceFlatDiscountApplied,
        } = this.applyDiscounts(
          originalSalePrice,
          originalMarketPrice,
          audienceDiscounts,
          inventory
        );
        if (discountedSalePrice !== audienceSalePrice) {
          discountedSalePrice = Math.min(
            discountedSalePrice,
            audienceSalePrice,
          );
          discountedMarketPrice = Math.min(
            discountedMarketPrice,
            audienceMarketPrice,
          );
          isFlatDiscountApplied =
            isFlatDiscountApplied || audienceFlatDiscountApplied;
          isMaximumPrice = false;
          inventory.max_price = null;
        }
      }

      inventory.sale_price = discountedSalePrice;
      inventory.market_price = discountedMarketPrice;
    }
    return { isFlatDiscountApplied, isMaximumPrice };
  }

  public applyDiscounts(
    originalSalePrice: number,
    originalMarketPrice: number,
    allDiscounts: SkuDiscount[],
    inventory: InventoryEntity,
  ): {
    discountedSalePrice: number;
    discountedMarketPrice: number;
    isFlatDiscountApplied: boolean;
  } {
    let isFlatDiscountApplied = false;
    let discountedSalePrice = originalSalePrice;
    let discountedMarketPrice = originalMarketPrice;

    for (const skuDiscount of allDiscounts) {
      if (
        DiscountTypeEnum.PERCENTAGE === skuDiscount.discountType ||
        skuDiscount.discountType == null
      ) {
        const calculatedSalePrice = this.calculateDiscountedSalePrice(
          originalSalePrice,
          skuDiscount.discount,
        );
        const calculatedMarketPrice = this.calculateDiscountedSalePrice(
          originalMarketPrice,
          skuDiscount.discount,
        );
        discountedSalePrice = Math.min(
          discountedSalePrice,
          calculatedSalePrice,
        );
        discountedMarketPrice = Math.min(
          discountedMarketPrice,
          calculatedMarketPrice,
        );
        if (calculatedSalePrice === discountedSalePrice) {
          isFlatDiscountApplied = false;
        }
      } else {
        // flat value
        if (skuDiscount.discount < discountedSalePrice) {
          discountedSalePrice = skuDiscount.discount;
          this.copySkuDiscountItemConfig(skuDiscount, inventory);
        }
        if (skuDiscount.discount < discountedMarketPrice) {
          discountedMarketPrice = skuDiscount.discount;
        }
        if (discountedSalePrice === skuDiscount.discount) {
          isFlatDiscountApplied = true;
        }
      }
    }

    return {
      discountedSalePrice,
      discountedMarketPrice,
      isFlatDiscountApplied,
    };
  }

  buildInventoryItemResponse = async (
    inventoryItem: InventoryEntity,
    inventoryParams: InventoryParams,
    productSynonymMap: Map<string, string>,
    societyDefaultDiscount: number,
    societySkuDiscountMap: Map<string, SkuDiscount[]>,
    audienceSkuDiscountMap: Map<string, SkuDiscount[]>,
    isReplaced: boolean,
    storeId: number,
    appVersion: string,
  ) => {
    let isFlatDiscountApplied = false;
    let isMaximumPrice = false;
    if (!isReplaced) {
      ({ isFlatDiscountApplied, isMaximumPrice } = this.assignNewSalePrice(
        societySkuDiscountMap,
        audienceSkuDiscountMap,
        societyDefaultDiscount,
        inventoryItem,
      ));
    }
    const inventoryItemResponse = new InventoryItemResponse();
    Object.assign(inventoryItemResponse, inventoryItem);
    if (
      inventoryItem.sale_price != null &&
      inventoryItem.product.per_pcs_weight != null
    ) {
      inventoryItemResponse.per_pcs_price =
        inventoryItem.sale_price * inventoryItem.product.per_pcs_weight;
    }
    if (inventoryParams.showOutOfStock == 1) {
      inventoryItemResponse.outOfStock = false;
    } else {
      inventoryItemResponse.outOfStock = inventoryItem.quantity <= 0;
    }
    if (inventoryParams.isOtpEnabled == 0) {
      inventoryItemResponse.product.isCoinsRedeemable = 0;
    }
    if (inventoryItem.product.isCoinsRedeemable == 1) {
      inventoryItemResponse.coinsGivenRatio = 0;
      inventoryItemResponse.coinsPrice =
        inventoryParams.spToCoinsRatio * inventoryItem.sale_price;
    } else {
      inventoryItemResponse.coinsGivenRatio = inventoryParams.coinsGivenRatio;
      inventoryItemResponse.coinsPrice = inventoryItem.sale_price;
    }
    if (productSynonymMap && productSynonymMap.has(inventoryItem.sku_code)) {
      inventoryItemResponse.synonyms = productSynonymMap.get(
        inventoryItem.sku_code,
      );
    }
    const consumerContents = inventoryItem.product.consumer_contents;
    if (
      consumerContents &&
      (consumerContents.procurementTypeExpiry == null ||
        new Date(consumerContents.procurementTypeExpiry) < new Date() ||
        consumerContents.procurementType == null ||
        consumerContents.procurementType.trim() === '')
    ) {
      consumerContents.procurementType = null;
      consumerContents.highlightType = null;
    }
    this.setPricingLabels(
      inventoryItem,
      inventoryParams,
      inventoryItemResponse,
      isFlatDiscountApplied,
      appVersion,
      isMaximumPrice,
    );
    return inventoryItemResponse;
  };

  public copySkuDiscountItemConfig(skuDiscountDto: SkuDiscount, inventoryItem: InventoryEntity) {
    if (skuDiscountDto.procurementTagExpiry != null &&
      skuDiscountDto.procurementTag &&
      skuDiscountDto.procurementTag.trim() !== ''
    ) {
      if (inventoryItem?.product?.consumer_contents) {
        inventoryItem.product.consumer_contents.procurementTypeExpiry = skuDiscountDto.procurementTagExpiry;
        inventoryItem.product.consumer_contents.procurementType = skuDiscountDto.procurementTag;
      }
    }
    if (inventoryItem.metadata == null) {
      inventoryItem.metadata = new InventoryMetadataDto();
    }
    if (skuDiscountDto.displayQty) {
      inventoryItem.metadata.displayQty = skuDiscountDto.displayQty;
    }
    if(skuDiscountDto.maxQuantity){
      this.setMaxQtyInProduct(inventoryItem.product,skuDiscountDto.maxQuantity);
    }
  }

  setMaxQtyInProduct(product: ProductEntity, maxQty: number) {
    for (const secondaryUomDetail of (product?.metadata?.secondaryUomDetails ?? [])) {
      if (
        secondaryUomDetail.uom === product?.metadata?.defaultUom &&
        secondaryUomDetail.max != null
      ) {
        secondaryUomDetail.max = maxQty;
      }
    }
    product.max_quantity = maxQty;
  }

  private setPricingLabels(
    inventoryItem: InventoryEntity,
    inventoryParams: InventoryParams,
    inventoryItemResponse: InventoryItemResponse,
    isFlatDiscountApplied: boolean,
    appVersion: string,
    isMaximumPrice: boolean,
  ) {
    // const isForecastedVersion = this.commonService.isVersionGreaterOrEqual(
    //   appVersion,
    //   inventoryParams.forecastedAppVersion,
    // );
    const isMaximumPriceVersion = this.commonService.isVersionGreaterOrEqual(
      appVersion,
      inventoryParams.maximumPriceAppVersion,
    );
    let isFixedDisplayPrice = isFlatDiscountApplied;

    if (isMaximumPriceVersion) {
      isFixedDisplayPrice =
        isFixedDisplayPrice ||
        inventoryParams.fixedDisplayPriceSkus.has(inventoryItem.sku_code) ||
        inventoryItem.product?.metadata?.showFixedPrice;
      if (
        inventoryItem.product.metadata.otherAppPrice != null &&
        inventoryItem.product.metadata.otherAppPrice !== 0
      ) {
        inventoryItemResponse.actualPricingLabel =
          inventoryParams.actualPricingLabel + ' 10% less + 0 delivery fees';
        inventoryItemResponse.soldAtPricingLabel = `Everywhere else: \u20B9${inventoryItem.product.metadata.otherAppPrice}/pack`;
      } else if (inventoryItem.metadata.marketingSalePrice != null) {
        inventoryItemResponse.actualPricingLabel = this.setPricingLabel(
          inventoryParams.actualPricingLabel,
          inventoryItem.sale_price,
          inventoryItem.metadata.marketingDisplayQty,
          inventoryItem.product,
        );
        inventoryItemResponse.soldAtPricingLabel = 'Fixed price';
      } else if (isFixedDisplayPrice) {
        inventoryItemResponse.actualPricingLabel = this.setPricingLabel(
          inventoryParams.actualPricingLabel,
          inventoryItem.sale_price,
          inventoryItem.metadata.displayQty,
          inventoryItem.product,
        );
        inventoryItemResponse.soldAtPricingLabel = 'Fixed price';
        inventoryItemResponse.labelPricingType = LabelPricingType.FIXED_PRICE;
      } else if (isMaximumPrice) {
        inventoryItemResponse.actualPricingLabel =
          inventoryParams.actualPricingLabel + ' This👇or less <i>';
        inventoryItemResponse.soldAtPricingLabel = this.setPricingLabel(
          'Maximum price:',
          inventoryItem.max_price,
          inventoryItem.metadata.displayQty,
          inventoryItem.product,
        );
        inventoryItemResponse.labelPricingType = LabelPricingType.MAXIMUM_PRICE;
      } else {
        inventoryItemResponse.actualPricingLabel =
          inventoryParams.actualPricingLabel + ' on actuals <i>';
        inventoryItemResponse.soldAtPricingLabel = this.setPricingLabel(
          inventoryParams.soldAtPricingLabel,
          inventoryItem.sale_price,
          inventoryItem.metadata.displayQty,
          inventoryItem.product,
        );
      }
    }
    // all user's are above maximum price app version , this code fragment is to be removed in coming builds

    // else if (isForecastedVersion) {
    //   isFixedDisplayPrice =
    //     isFixedDisplayPrice ||
    //     inventoryParams.fixedDisplayPriceSkus.has(inventoryItem.sku_code) ||
    //     inventoryItem.product?.metadata?.showFixedPrice;
    //   if (inventoryItem.metadata.marketingSalePrice != null) {
    //     inventoryItemResponse.actualPricingLabel = this.setPricingLabel(
    //       inventoryParams.actualPricingLabel,
    //       inventoryItem.sale_price,
    //       inventoryItem.metadata.marketingDisplayQty,
    //       inventoryItem.product,
    //     );
    //     inventoryItemResponse.soldAtPricingLabel = 'Fixed price';
    //   } else if (isFixedDisplayPrice) {
    //     inventoryItemResponse.actualPricingLabel = this.setPricingLabel(
    //       inventoryParams.actualPricingLabel,
    //       inventoryItem.sale_price,
    //       inventoryItem.metadata.displayQty,
    //       inventoryItem.product,
    //     );
    //     inventoryItemResponse.soldAtPricingLabel = 'Fixed price';
    //   } else {
    //     inventoryItemResponse.actualPricingLabel =
    //       inventoryParams.actualPricingLabel + ' on actuals <i>';
    //     inventoryItemResponse.soldAtPricingLabel = this.setPricingLabel(
    //       inventoryParams.soldAtPricingLabel,
    //       inventoryItem.sale_price,
    //       inventoryItem.metadata.displayQty,
    //       inventoryItem.product,
    //     );
    //   }
    // } else {
    //   if (inventoryItem.metadata.marketingSalePrice != null) {
    //     inventoryItemResponse.actualPricingLabel = this.setPricingLabel(
    //       inventoryParams.actualPricingLabel + ' fixed',
    //       inventoryItem.sale_price,
    //       inventoryItem.metadata.marketingDisplayQty,
    //       inventoryItem.product,
    //     );
    //     inventoryItemResponse.soldAtPricingLabel = 'Special Offer';
    //   } else if (isFixedDisplayPrice) {
    //     inventoryItemResponse.actualPricingLabel = this.setPricingLabel(
    //       inventoryParams.actualPricingLabel + ' fixed',
    //       inventoryItem.sale_price,
    //       inventoryItem.metadata.displayQty,
    //       inventoryItem.product,
    //     );
    //     inventoryItemResponse.soldAtPricingLabel = 'Special Offer';
    //   } else {
    //     inventoryItemResponse.actualPricingLabel =
    //       inventoryParams.actualPricingLabel + ' on actuals';
    //     inventoryItemResponse.soldAtPricingLabel = this.setPricingLabel(
    //       inventoryParams.soldAtPricingLabel,
    //       inventoryItem.sale_price,
    //       inventoryItem.metadata.displayQty,
    //       inventoryItem.product,
    //     );
    //   }
    // }
  }

  setPricingLabel(
    baseLabel: string,
    salePrice: number,
    displayQty: number | null,
    product: ProductEntity,
  ): string {
    const uom = this.unitOfMeasurementString(product);
    let formattedPrice: number;
    let displayQtyWithSuffix: string;

    if (uom === 'kg') {
      displayQtyWithSuffix = displayQty
        ? this.convertToKgOrGm(displayQty)
        : this.unitOfMeasurementString(product);
      formattedPrice = displayQty
        ? Math.ceil(salePrice * displayQty)
        : salePrice;
    } else {
      displayQtyWithSuffix = uom;
      formattedPrice = salePrice;
    }

    return `${baseLabel} \u20B9${formattedPrice}/${displayQtyWithSuffix}`;
  }

  convertToKgOrGm(quantity: number): string {
    if (quantity > 1) {
      return quantity + 'kg';
    } else if (quantity === 1) {
      return 'kg';
    } else {
      return quantity * 1000 + 'gm';
    }
  }
  async getPosInventoryByFilters(filters: FindOptionsWhere<InventoryEntity>) {
    return await this.inventoryRepository.find({
      where: {
        ...filters,
        product: { is_active: true, sku_type: 'POS' },
      },
      relations: ['product', 'product.category'],
    });
  }

  async getPosInventoryFromStoreId(storeId: string) {
    return await this.inventoryRepository.find({
      where: {
        store_id: storeId,
        is_active: true,
        product: { is_active: true, sku_type: 'POS' },
      },
      relations: ['product', 'product.category'],
    });
  }

  async getInventoryById(inventoryId: string) {
    return await this.inventoryRepository.findOne({
      where: { id: inventoryId },
    });
  }

  async save(inventory: InventoryEntity): Promise<InventoryEntity> {
    await this.updateInventoryTimeParam();
    return await this.inventoryRepository.save(inventory);
  }

  async fetchByArticleNumberAndStoreId(
    article_number: number,
    storeId: string,
  ) {
    return await this.inventoryRepository.findOne({
      where: { article_number: article_number, store_id: storeId },
    });
  }

  async getInventoryFromStoreIdAndSkuCodes(
    storeId: string,
    skuCodes: string[],
  ) {
    return await this.inventoryRepository.find({
      where: { store_id: storeId, sku_code: In(skuCodes) },
    });
  }

  async bulkSave(inventory: InventoryEntity[]) {
    await this.updateInventoryTimeParam();
    return await this.inventoryRepository.save(inventory);
  }

  async validatePricingSheetUpload(
    inventoryPricingUploadBeans: InventoryPricingUploadBean[],
    storeIds: string[],
    pricingType: PricingType,
  ) {
    const posPricingParseResults =
      new ParseResult<InventoryPricingUploadBean>();
    for (const storeId of storeIds) {
      const existingInventoryMap: Map<string, InventoryEntity> =
        await this.getExistingInventoryMapForStore(
          storeId,
          inventoryPricingUploadBeans.map((pricingBean) => {
            return pricingBean.skuCode;
          }),
        );
      const saveInventoryPricingBeans = this.commonService.createDeepCopy(inventoryPricingUploadBeans);
      const skuCodeSet = new Set<string>();
      for (const pricingRawBean of saveInventoryPricingBeans) {
        if (pricingRawBean.skuCode == null) {
          pricingRawBean.errors.push(
            new ErrorBean('FIELD_ERROR', 'SKU code is mandatory', 'skuCode'),
          );
        } else if (!existingInventoryMap.has(pricingRawBean.skuCode)) {
          pricingRawBean.errors.push(
            new ErrorBean('FIELD_ERROR', `SKU not found in inventory for store : ${storeId}`, 'skuCode'),
          );
        } else if (skuCodeSet.has(pricingRawBean.skuCode)) {
          pricingRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Duplicate SKU found in the sheet.',
              'skuCode',
            ),
          );
        } else if (
          pricingRawBean.salePrice == null ||
          pricingRawBean.salePrice.toString() == '' ||
          pricingRawBean.marketPrice == null ||
          pricingRawBean.marketPrice.toString() == ''
        ) {
          pricingRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Both Sale Price and market price are mandatory',
              'salePrice',
            ),
          );
        } else if (
          pricingRawBean.salePrice != null &&
          (isNaN(pricingRawBean.salePrice) ||
            Number(pricingRawBean.salePrice) < 0)
        ) {
          pricingRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Sale Price cannot be negative.',
              'salePrice',
            ),
          );
        } else if (
          pricingRawBean.marketPrice != null &&
          (isNaN(pricingRawBean.marketPrice) ||
            Number(pricingRawBean.marketPrice) < 0)
        ) {
          pricingRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Market Price cannot be negative.',
              'marketPrice',
            ),
          );
        } else if (
          pricingRawBean.displayQty != null &&
          (isNaN(pricingRawBean.displayQty) ||
            Number(pricingRawBean.displayQty) < 0)
        ) {
          pricingRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Display Quantity should be a number and more than 0.',
              'displayQty',
            ),
          );
        } else {
          pricingRawBean.salePrice = Number(pricingRawBean.salePrice);
          pricingRawBean.marketPrice = Number(pricingRawBean.marketPrice);
          pricingRawBean.pricingType = pricingType;
          pricingRawBean.storeId = storeId;
          if (pricingRawBean.displayQty != null) {
            pricingRawBean.displayQty = Number(pricingRawBean.displayQty);
          } else {
            pricingRawBean.displayQty = null;
          }
          skuCodeSet.add(pricingRawBean.skuCode);
        }
        if (pricingRawBean.errors.length == 0) {
          posPricingParseResults.successRows.push(pricingRawBean);
        } else {
          posPricingParseResults.failedRows.push(pricingRawBean);
        }
      }
    }
    return posPricingParseResults;
  }

  async getExistingInventoryMapForStore(storeId: string, skuCodes: string[]) {
    const inventory = await this.getInventoryFromStoreIdAndSkuCodes(
      storeId,
      skuCodes,
    );
    return new Map(
      inventory.map((inv) => {
        return [inv.sku_code, inv];
      }),
    );
  }

  async getExistingInventoryMapForWh(whId: string, skuCodes: string[]) {
    const inventory = await this.findBySkuCodeAndWhId(skuCodes, whId);
    return new Map(
      inventory.map((inv) => {
        return [inv.sku_code, inv];
      }),
    );
  }

  async updateInventoryPricing(
    inventoryPricingUploadBeans: InventoryPricingUploadBean[],
    userId: string,
  ) {
    const storeIds = new Set<string>(inventoryPricingUploadBeans.map(bean => bean.storeId));
    for (const storeId of storeIds) {
      const inventoryEntities = await this.getInventoryFromStoreIdAndSkuCodes(
        storeId,
        inventoryPricingUploadBeans.map((posInventoryPricingUploadBean) => {
          return posInventoryPricingUploadBean.skuCode;
        }),
      );
      const filteredBeans =
        inventoryPricingUploadBeans.filter(bean => bean.storeId === storeId);
      const inventoryUploadBeanMap = new Map(
        filteredBeans.map(bean => [bean.skuCode, bean]),
      );
      for (const inventory of inventoryEntities) {
        const inventoryUploadBean = inventoryUploadBeanMap.get(
          inventory.sku_code,
        );
        const inventoryDetails = { ...inventory };

        if (inventoryUploadBeanMap.has(inventory.sku_code)) {
          if (inventory.metadata == null) {
            inventory.metadata = new InventoryMetadataDto();
          }
          if (
            inventoryUploadBean.pricingType == PricingType.MarketingSellingPrice
          ) {
            inventory.metadata.marketingSalePrice = inventoryUploadBean.salePrice;
            inventory.sale_price = inventoryUploadBean.salePrice;
            if (inventoryUploadBean.displayQty != null) {
              inventory.metadata.marketingDisplayQty =
                inventoryUploadBean.displayQty;
            } else {
              inventory.metadata.marketingDisplayQty = null;
            }
          } else if (
            inventoryUploadBean.pricingType == PricingType.NextDaySellingPrice
          ) {
            if (inventoryUploadBean.salePrice != null) {
              inventory.metadata.nextDaySalePrice = inventoryUploadBean.salePrice;
            }
            if (inventoryUploadBean.marketPrice != null) {
              inventory.metadata.nextDayMarketPrice =
                inventoryUploadBean.marketPrice;
            }
          } else {
            if (inventoryUploadBean.salePrice != null) {
              inventory.sale_price = inventoryUploadBean.salePrice;
            }
            if (inventoryUploadBean.marketPrice != null) {
              inventory.market_price = inventoryUploadBean.marketPrice;
            }
            if (inventoryUploadBean.displayQty != null) {
              inventory.metadata.displayQty = inventoryUploadBean.displayQty;
            } else {
              inventory.metadata.displayQty = null;
            }
          }
          inventory.updated_by = userId;
        }
        await this.insertUpdatePriceLogs(
          inventoryUploadBean,
          inventoryDetails,
          'file-upload',
        );
      }
      await this.bulkSave(inventoryEntities);
    }
  }

  async insertUpdatePriceLogs(
    inventoryUploadBean: { marketPrice: number; salePrice: number },
    inventoryDetails: InventoryEntity,
    source: string,
  ) {
    try {
      if (
        (inventoryUploadBean.marketPrice &&
          inventoryUploadBean.marketPrice !== inventoryDetails.market_price) ||
        (inventoryUploadBean.salePrice &&
          inventoryUploadBean.salePrice !== inventoryDetails.sale_price)
      ) {
        const updateInventoryPriceObj: UpdatePriceLogObject[] =
          this.buildInventoryUpdatePriceData(
            [
              {
                market_price: inventoryUploadBean.marketPrice,
                sale_price: inventoryUploadBean.salePrice,
              },
            ],
            [inventoryDetails],
            source,
          );
        await this.insertInventoryPriceLog(updateInventoryPriceObj);
      }
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while inserting inventory log for updateInventoryPrice : ' +
          JSON.stringify(inventoryUploadBean),
        e,
      );
    }
  }

  async updateInventoryQuantityBulk(
    inventory: InventoryEntity[],
    qtyUpdateList: { quantity: number; source: string; skuCode: string }[],
    inventoryUpdateType: InventoryUpdateType,
    userId: string,
  ) {
    const qtyUpdateMap = new Map(
      qtyUpdateList.map((qtyUpdateItem) => {
        return [qtyUpdateItem.skuCode, qtyUpdateItem];
      }),
    );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const inventoryUpdateLogs: InventoryUpdateLogEntity[] = [];
      for (const inventoryItem of inventory) {
        const qtyUpdateItem = qtyUpdateMap.get(inventoryItem.sku_code);
        const fromQty =
          inventoryItem.quantity != null ? inventoryItem.quantity : 0;
        inventoryItem.quantity = fromQty + qtyUpdateItem.quantity;
        const inventoryUpdateLogEntity =
          InventoryUpdateLogEntity.createInventoryUpdateLogEntity(
            inventoryItem.sku_code,
            qtyUpdateItem.source,
            inventoryItem.store_id,
            qtyUpdateItem.quantity,
            fromQty,
            inventoryItem.quantity,
            InventoryType.SALE,
            inventoryUpdateType,
            null,
            userId,
          );
        inventoryUpdateLogs.push(inventoryUpdateLogEntity);
      }
      await queryRunner.manager.save(inventory);
      await queryRunner.manager.save(inventoryUpdateLogs);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async moveInventoryBulk(
    from: InventoryType,
    to: InventoryType,
    inventory: InventoryEntity[],
    movementMap: Map<string, { quantity: number; skuCode: string }>,
    userId: string,
  ) {
    let success = true;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const inventoryUpdateLogs: InventoryUpdateLogEntity[] = [];
      for (const inventoryItem of inventory) {
        const movementItem = movementMap.get(inventoryItem.sku_code);
        const fromToLogItems = this.moveInventoryAndGetLogsItems(
          from,
          to,
          'movement',
          inventoryItem,
          movementItem.quantity,
          userId,
        );
        fromToLogItems.forEach((logItem) => {
          inventoryUpdateLogs.push(logItem);
        });
      }
      await queryRunner.manager.save(inventory);
      await queryRunner.manager.save(inventoryUpdateLogs);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      success = false;
    } finally {
      await queryRunner.release();
    }
    return success;
  }

  private moveInventoryAndGetLogsItems(
    from: InventoryType,
    to: InventoryType,
    source: string,
    inventory: InventoryEntity,
    quantity: number,
    userId: string,
  ) {
    const fromQty1 = this.getInventoryQty(inventory, from);
    const toQty1 = fromQty1 - quantity;
    const fromQty2 = this.getInventoryQty(inventory, to);
    const toQty2 = fromQty2 + quantity;
    this.moveInventoryQtyFromType(inventory, from, to, quantity);
    return [
      InventoryUpdateLogEntity.createInventoryUpdateLogEntity(
        inventory.sku_code,
        source,
        inventory.store_id,
        -quantity,
        fromQty1,
        toQty1,
        from,
        InventoryUpdateType.MOVEMENT,
        `${InventoryType[from]}-${InventoryType[to]}`,
        userId,
      ),
      InventoryUpdateLogEntity.createInventoryUpdateLogEntity(
        inventory.sku_code,
        source,
        inventory.store_id,
        quantity,
        fromQty2,
        toQty2,
        to,
        InventoryUpdateType.MOVEMENT,
        `${InventoryType[to]}-${InventoryType[from]}`,
        userId,
      ),
    ];
  }

  private getInventoryQty(
    inventory: InventoryEntity,
    inventoryType: InventoryType,
  ) {
    if (inventoryType == InventoryType.HOLD) {
      return inventory.hold;
    } else if (inventoryType == InventoryType.DUMP) {
      return inventory.dump;
    }
    return inventory.quantity;
  }

  private moveInventoryQtyFromType(
    inventory: InventoryEntity,
    from: InventoryType,
    to: InventoryType,
    quantity: number,
  ) {
    if (from == InventoryType.HOLD) {
      inventory.hold -= quantity;
    } else if (from == InventoryType.DUMP) {
      inventory.dump -= quantity;
    } else {
      inventory.quantity -= quantity;
    }
    if (to == InventoryType.HOLD) {
      inventory.hold += quantity;
    } else if (to == InventoryType.DUMP) {
      inventory.dump += quantity;
    } else {
      inventory.quantity += quantity;
    }
  }

  public async getInventoryMapFromStoreIdAndSkuCodes(
    storeId: string,
    skuCodeList: string[],
  ): Promise<Map<string, InventoryEntity>> {
    const inventoryList = await this.getInventoryFromStoreIdAndSkuCodes(
      storeId,
      skuCodeList,
    );
    return new Map(
      inventoryList.map((inventory) => [inventory.sku_code, inventory]),
    );
  }

  async mapUnmapMasterProducts(
    productsIds: string[],
    storeId: string,
    userId: string,
    isForMapping: boolean,
  ): Promise<void> {
    if (!productsIds || productsIds.length === 0) {
      return;
    }
    const products = await this.productsService.getProductsByIds(productsIds);
    const inventoryMap = await this.getInventoryMapFromStoreIdAndSkuCodes(
      storeId,
      products.map((product) => product.sku_code),
    );
    const inventoryList: InventoryEntity[] = [];
    for (const product of products) {
      if (inventoryMap.has(product.sku_code)) {
        const inventory = inventoryMap.get(product.sku_code);
        inventory.is_active = isForMapping;
        inventory.updated_by = userId;
        inventoryList.push(inventory);
      } else if (isForMapping == true) {
        const newInventory = InventoryEntity.createNewInventoryEntry(
          storeId,
          product.sku_code,
          0,
          [],
          product.name,
          product.market_price,
          product.sale_price,
          product.unit_of_measurement,
          product.article_number,
          [],
          userId,
          null,
        );
        inventoryList.push(newInventory);
      }
    }
    await this.bulkSave(inventoryList);
  }

  async addInventoryBulk(
    to: InventoryType,
    inventory: InventoryEntity[],
    additionMap: Map<
      string,
      { quantity: number; skuCode: string; remarks: string }
    >,
    source: string,
    userId: string,
  ) {
    let success = true;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const inventoryUpdateLogs: InventoryUpdateLogEntity[] = [];
      for (const inventoryItem of inventory) {
        const additionItem = additionMap.get(inventoryItem.sku_code);
        const fromToLogItems = this.addInventoryAndGetLogsItems(
          to,
          source,
          inventoryItem,
          additionItem.quantity,
          userId,
        );
        fromToLogItems.forEach((logItem) => {
          logItem.remarks = additionItem.remarks;
          inventoryUpdateLogs.push(logItem);
        });
      }
      await queryRunner.manager.save(inventory);
      await queryRunner.manager.save(inventoryUpdateLogs);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      success = false;
    } finally {
      await queryRunner.release();
    }
    return success;
  }

  private addInventoryAndGetLogsItems(
    to: InventoryType,
    source: string,
    inventory: InventoryEntity,
    quantity: number,
    userId: string,
  ) {
    const fromQty = this.getInventoryQty(inventory, to);
    const toQty = fromQty + quantity;
    this.addInventoryQtyFromType(inventory, to, quantity);
    return [
      InventoryUpdateLogEntity.createInventoryUpdateLogEntity(
        inventory.sku_code,
        source,
        inventory.store_id,
        quantity,
        fromQty,
        toQty,
        to,
        InventoryUpdateType.RECEIVE,
        null,
        userId,
      ),
    ];
  }

  private addInventoryQtyFromType(
    inventory: InventoryEntity,
    to: InventoryType,
    quantity: number,
  ) {
    if (to == InventoryType.HOLD) {
      inventory.hold += quantity;
    } else if (to == InventoryType.DUMP) {
      inventory.dump += quantity;
    } else {
      inventory.quantity += quantity;
    }
  }

  async validateInventorySheetUpload(
    backofficeInventoryUploadBeans: BackofficeInventoryUploadBean[],
    grades: string[],
    storeIds : string[]
  ) {
    const backofficeInventoryParseResults =
      new ParseResult<BackofficeInventoryUploadBean>();
    for (const storeId of storeIds) {
      const whSkuInventory =
        await this.fetchAllWhSkuB2cInventory(storeId);
      const whSkuMap = new Map<string, WarehouseSkuB2cBean>(
        whSkuInventory.map((whSku) => {
          return [whSku.skuCode, whSku];
        }),
      );
      const invUploadBeans: BackofficeInventoryUploadBean[] = this.commonService.createDeepCopy(backofficeInventoryUploadBeans);
      const skuCodes = invUploadBeans.map(
        (invUploadBeans) => invUploadBeans.skuCode,
      );
      const existingInventoryMap: Map<string, ProductEntity> =
        await this.productsService.getExistingProductsMap(skuCodes);

      const inventoryList: InventoryEntity[] =
        await this.inventoryRepository.find({
        where: { sku_code: In(skuCodes) },
        select: ['id', 'quantity', 'availability','sku_code','metadata'],
      });
      const inventoryMap = new Map(
        inventoryList.map((inventory) => {
          return [inventory.sku_code, inventory];
        }),
      );
      const skuCodeGradeSet = new Set<string>();
      for (const backofficeInventoryUploadRawBean of invUploadBeans) {
        const warehouseSku = whSkuMap.get(
          backofficeInventoryUploadRawBean.skuCode,
        );
        const whSkuContainsGrade = warehouseSku && warehouseSku.grades.length > 0;
        const inventoryItem = inventoryMap.get(
          backofficeInventoryUploadRawBean.skuCode,
        );
        const availableItem = await this.validateAvailableQty(
          inventoryItem,
          Number(backofficeInventoryUploadRawBean.quantity),
        );
        if (backofficeInventoryUploadRawBean.skuCode == null) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean('FIELD_ERROR', 'SKU code is mandatory', 'skuCode'),
          );
        } else if (
          !existingInventoryMap.has(backofficeInventoryUploadRawBean.skuCode)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean('FIELD_ERROR', 'SKU not found in inventory', 'skuCode'),
          );
        } else if (
          backofficeInventoryUploadRawBean.gradeName &&
          !grades.includes(backofficeInventoryUploadRawBean.gradeName)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean('FIELD_ERROR', 'Grade name is invalid', 'gradeName'),
          );
        } else if (
          !backofficeInventoryUploadRawBean.gradeName &&
          !whSkuContainsGrade
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Provide atleast one grade with buffers',
              'gradeName',
            ),
          );
        } else if (
          skuCodeGradeSet.has(backofficeInventoryUploadRawBean.skuCode)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Duplicate SKU-Grade found in the sheet.',
              'skuCode',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.salePrice != null &&
          (isNaN(backofficeInventoryUploadRawBean.salePrice) ||
            Number(backofficeInventoryUploadRawBean.salePrice) < 0)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Sale Price format is incorrect.',
              'salePrice',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.marketPrice != null &&
          (isNaN(backofficeInventoryUploadRawBean.marketPrice) ||
            Number(backofficeInventoryUploadRawBean.marketPrice) < 0)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Market Price format is incorrect.',
              'marketPrice',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.quantity != null &&
          (isNaN(backofficeInventoryUploadRawBean.quantity) ||
            Number(backofficeInventoryUploadRawBean.quantity) < 0)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'quantity format is incorrect.',
              'quantity',
            ),
          );
        } else if (!availableItem) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Cart Qty is greater than Inventory Qty',
              'quantity',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.consumerBufferPerc != null &&
          (isNaN(backofficeInventoryUploadRawBean.consumerBufferPerc) ||
            Number(backofficeInventoryUploadRawBean.consumerBufferPerc) < 0)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Consumer Buffer Percent format is incorrect.',
              'consumerBufferPerc',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.logisticBufferPerc != null &&
          (isNaN(backofficeInventoryUploadRawBean.logisticBufferPerc) ||
            Number(backofficeInventoryUploadRawBean.logisticBufferPerc) < 0)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Logistic Buffer Percent format is incorrect.',
              'logisticBufferPerc',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.rtvBufferPerc != null &&
          (isNaN(backofficeInventoryUploadRawBean.rtvBufferPerc) ||
            Number(backofficeInventoryUploadRawBean.rtvBufferPerc) < 0)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'RTV Buffer Percent format is incorrect.',
              'rtvBufferPerc',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.cratingBufferPerc != null &&
          (isNaN(backofficeInventoryUploadRawBean.cratingBufferPerc) ||
            Number(backofficeInventoryUploadRawBean.cratingBufferPerc) < 0)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              'Crating Buffer Percent format is incorrect.',
              'cratingBufferPerc',
            ),
          );
        } else if (
          backofficeInventoryUploadRawBean.priceBracketsString != null &&
          backofficeInventoryUploadRawBean.priceBracketsString != '' &&
          this.parsePriceBracketString(
            backofficeInventoryUploadRawBean.priceBracketsString,
          ) == null
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean(
              'FIELD_ERROR',
              `Price Bracket Format Incorrect for SkuCode : ${backofficeInventoryUploadRawBean.skuCode}`,
              'priceBracketString',
            ),
          );
        } else if (
          !warehouseSku &&
          backofficeInventoryUploadRawBean.moq == null &&
          (warehouseSku == null || warehouseSku.moq == null)
        ) {
          backofficeInventoryUploadRawBean.errors.push(
            new ErrorBean('FIELD_ERROR', 'MOQ is Mandatory', 'moq'),
          );
        } else {
          if (backofficeInventoryUploadRawBean.priceBracketsString != null) {
            backofficeInventoryUploadRawBean.priceBrackets =
              this.parsePriceBracketString(
                backofficeInventoryUploadRawBean.priceBracketsString,
              );
          }
          if (backofficeInventoryUploadRawBean.salePrice != null) {
            backofficeInventoryUploadRawBean.salePrice = Number(
              backofficeInventoryUploadRawBean.salePrice,
            );
          }
          if (backofficeInventoryUploadRawBean.marketPrice != null) {
            backofficeInventoryUploadRawBean.marketPrice = Number(
              backofficeInventoryUploadRawBean.marketPrice,
            );
          }
          if (backofficeInventoryUploadRawBean.quantity != null) {
            backofficeInventoryUploadRawBean.quantity = Number(
              backofficeInventoryUploadRawBean.quantity,
            );
          }
          if (backofficeInventoryUploadRawBean.consumerBufferPerc != null) {
            backofficeInventoryUploadRawBean.consumerBufferPerc = Number(
              backofficeInventoryUploadRawBean.consumerBufferPerc,
            );
          } else {
            backofficeInventoryUploadRawBean.consumerBufferPerc = 0;
          }
          if (backofficeInventoryUploadRawBean.logisticBufferPerc != null) {
            backofficeInventoryUploadRawBean.logisticBufferPerc = Number(
              backofficeInventoryUploadRawBean.logisticBufferPerc,
            );
          } else {
            backofficeInventoryUploadRawBean.logisticBufferPerc = 0;
          }
          if (backofficeInventoryUploadRawBean.rtvBufferPerc != null) {
            backofficeInventoryUploadRawBean.rtvBufferPerc = Number(
              backofficeInventoryUploadRawBean.rtvBufferPerc,
            );
          } else {
            backofficeInventoryUploadRawBean.rtvBufferPerc = 0;
          }
          if (backofficeInventoryUploadRawBean.cratingBufferPerc != null) {
            backofficeInventoryUploadRawBean.cratingBufferPerc = Number(
              backofficeInventoryUploadRawBean.cratingBufferPerc,
            );
          } else {
            backofficeInventoryUploadRawBean.cratingBufferPerc = 0;
          }
          if (backofficeInventoryUploadRawBean.moq != null) {
            backofficeInventoryUploadRawBean.moq = Number(
              backofficeInventoryUploadRawBean.moq,
            );
          }
          backofficeInventoryUploadRawBean.storeId = storeId;
          const skuGrade =
            backofficeInventoryUploadRawBean.gradeName == null
              ? 'Default'
              : backofficeInventoryUploadRawBean.gradeName;
          backofficeInventoryUploadRawBean.gradeName = skuGrade;
          const skuGradeKey =
            backofficeInventoryUploadRawBean.skuCode + '-' + skuGrade;
          skuCodeGradeSet.add(skuGradeKey);
        }
        if (backofficeInventoryUploadRawBean.errors.length == 0) {
          backofficeInventoryParseResults.successRows.push(
            backofficeInventoryUploadRawBean,
          );
        } else {
          backofficeInventoryParseResults.failedRows.push(
            backofficeInventoryUploadRawBean,
          );
        }
      }
    }
    return backofficeInventoryParseResults;
  }

  parsePriceBracketString(
    priceBracketsString: string,
  ): PriceBracketDto[] | null {
    const ranges: string[] = priceBracketsString.split(',');
    const priceBrackets: PriceBracketDto[] = [];
    let previousMax: number | null = null;
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const slabParts = range.split(':');
      if (slabParts.length !== 3) {
        return null;
      }
      try {
        const qty = slabParts[0].split('-');
        const min = Number(parseFloat(qty[0]).toFixed(2));
        const max = Number(parseFloat(qty[1]).toFixed(2));
        const salePrice = parseFloat(slabParts[1]);
        const discountPercent = parseFloat(slabParts[2]);
        if (
          min < 0 ||
          max < min ||
          (previousMax !== null && min !== previousMax) ||
          (i === 0 && min !== 0) ||
          (i === ranges.length - 1 && max <= 50000)
        ) {
          return null;
        }
        for (const priceBracket of priceBrackets) {
          if (this.checkOverlap(priceBracket, min, max)) {
            return null;
          }
        }
        priceBrackets.push(
          PriceBracketDto.createPriceBracket(
            min,
            max,
            salePrice,
            discountPercent,
          ),
        );
        previousMax = max;
      } catch (e) {
        return null;
      }
    }
    return priceBrackets;
  }

  async fetchAllWhSkuB2cInventory(
    storeId: string,
  ): Promise<WarehouseSkuB2cBean[]> {
    const warehouseURL = `${this.configService.get<string>(
      'warehouse_url',
    )}/api/v1/catalog/store/${storeId}/wh-sku/b2c`;
    try {
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': this.configService.get<string>('rz_auth_key'),
        },
      });
    } catch (e) {
      throw new HttpException(
        { message: 'Something went wrong while fetching data from Warehouse.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateInventoryBackoffice(
    backofficeInventoryUploadBeans: BackofficeInventoryUploadBean[],
    userId: string,
  ) {
    const storeIds = new Set<string>(backofficeInventoryUploadBeans.map(bean => bean.storeId));
    for (const storeId of storeIds) {
      const whSkuInventory = await this.fetchAllWhSkuB2cInventory(storeId);
      const whSkuMap = new Map<string, WarehouseSkuB2cBean>(
        whSkuInventory.map((whSku) => {
          return [whSku.skuCode, whSku];
        }),
      );
      const filteredBeans = backofficeInventoryUploadBeans.filter(bean => bean.storeId === storeId);
      const skuCodes = filteredBeans.map(
        (filteredBean) => filteredBean.skuCode,
      );

      const inventoryList: InventoryEntity[] =
        await this.inventoryRepository.find({
          where: { sku_code: In(skuCodes) },
        });
      const inventoryMap = new Map(
        inventoryList.map((inventory) => {
          return [inventory.sku_code, inventory];
        }),
      );
      const skuCodeMap = new Map<string, DeepPartial<InventoryEntity>>();
      const skuCodeWhMap = new Map<string, CreateWmsB2cInventoryDto>();
      for (const backofficeUploadBean of filteredBeans) {
        if (skuCodeMap.has(backofficeUploadBean.skuCode)) {
          skuCodeMap.get(backofficeUploadBean.skuCode).grades.push({
            name: backofficeUploadBean.gradeName,
            image: '',
            description: '',
          });
          skuCodeWhMap.get(backofficeUploadBean.skuCode).grades.push({
            name: backofficeUploadBean.gradeName,
            consumerBufferPerc: backofficeUploadBean.consumerBufferPerc,
            logisticBufferPerc: backofficeUploadBean.logisticBufferPerc,
            rtvBufferPerc: backofficeUploadBean.rtvBufferPerc,
            cratingBufferPerc: backofficeUploadBean.cratingBufferPerc,
          });
        } else {
          const originalEntity = inventoryMap.get(backofficeUploadBean.skuCode);
          const inventoryEntity: DeepPartial<InventoryEntity> = {
            store_id: storeId,
            sku_code: backofficeUploadBean.skuCode,
            updated_by: userId,
            metadata: originalEntity.metadata ?? {},
          };
          if (backofficeUploadBean.quantity != null) {
            const inventoryItem = inventoryMap.get(backofficeUploadBean.skuCode);
            const availableItem = await this.validateAvailableQty(
              inventoryItem,
              backofficeUploadBean.quantity,
            );
            if (!availableItem) {
              continue;
            }
            inventoryEntity.quantity = availableItem.quantity;
            inventoryEntity.total_quantity = backofficeUploadBean.quantity;
            inventoryEntity.metadata.resetQty = availableItem.metadata.resetQty;
          }
          if (backofficeUploadBean.salePrice != null) {
            inventoryEntity.sale_price = backofficeUploadBean.salePrice;
          }
          if (backofficeUploadBean.marketPrice != null) {
            inventoryEntity.market_price = backofficeUploadBean.marketPrice;
          }
          if (backofficeUploadBean.priceBrackets != null) {
            inventoryEntity.price_brackets = backofficeUploadBean.priceBrackets;
          }
          if (backofficeUploadBean.gradeName != null) {
            inventoryEntity.grades = [{ name: backofficeUploadBean.gradeName }];
          }
          if (inventoryEntity.grades != null) {
            inventoryEntity.grades = inventoryEntity.grades
              .filter((grade) => {
                return grade.name.toLowerCase() != 'default';
              })
              .map((grade) => {
                return {
                  name: grade.name,
                };
              });
            if (inventoryEntity.grades.length == 0) {
              inventoryEntity.grades = null;
            }
          }
          skuCodeMap.set(backofficeUploadBean.skuCode, inventoryEntity);
          skuCodeWhMap.set(
            backofficeUploadBean.skuCode,
            this.buildSaveWhSkuInventoryData(
              {
                sku_code: backofficeUploadBean.skuCode,
                grades: [
                  {
                    name: backofficeUploadBean.gradeName,
                    consumerBufferPerc: backofficeUploadBean.consumerBufferPerc,
                    logisticBufferPerc: backofficeUploadBean.logisticBufferPerc,
                    rtvBufferPerc: backofficeUploadBean.rtvBufferPerc,
                    cratingBufferPerc: backofficeUploadBean.cratingBufferPerc,
                    image: null,
                    description: null,
                  },
                ],
                procurement_category: backofficeUploadBean.procurement_category,
                moq: backofficeUploadBean.moq,
              },
              whSkuMap.get(backofficeUploadBean.skuCode),
            ),
          );
        }
      }
      await this.inventoryRepository.upsert(new Array(...skuCodeMap.values()), [
        'sku_code',
        'store_id',
      ]);
      await this.updateInventoryTimeParam();
      await this.saveWhSkuInventory(storeId, new Array(...skuCodeWhMap.values()));
    }
  }

  private checkOverlap(
    priceBracket: PriceBracketDto,
    min: number,
    max: number,
  ) {
    return !(priceBracket.max <= min || priceBracket.min >= max);
  }

  async findInventoryById(inventoryId) {
    return await this.inventoryRepository.findOne({
      where: { id: inventoryId },
    });
  }

  async findBySkuCodeAndWhId(skuCode, whId) {
    let storeList = await this.getWhStores(whId);
    let skuList = [];
    if (typeof skuCode == 'string') {
      skuList.push(skuCode);
    } else {
      skuList = skuCode;
    }
    return await this.inventoryRepository.find({
      where: {
        store_id: In(storeList),
        sku_code: In(skuList),
      },
    });
  }

  public async getWhStores(whId: string): Promise<string[]> {
    const whStoreString = await this.storeParamsService.getStringParamValue(
      'WAREHOUSE_STORES',
      '',
    );
    if (!whStoreString) {
      throw new HttpException(
        { message: `No warehouse stores found` },
        HttpStatus.NOT_FOUND,
      );
    }
    const whStoresMap = new Map(
      whStoreString.split('|').map((whStore) => {
        const [key, value] = whStore.split(':');
        return [key, value.split(',')];
      }),
    );
    if (!whStoresMap.has(whId)) {
      throw new HttpException(
        { message: `No store list available for whId: ${whId}` },
        HttpStatus.NOT_FOUND,
      );
    }
    return whStoresMap.get(whId) || [];
  }

  async fetchWhSkuInventoryBySkuCode(
    storeId: string,
    skuCode: string,
  ): Promise<WarehouseSkuB2cBean> {
    const warehouseURL = `${this.configService.get<string>(
      'warehouse_url',
    )}/api/v1/catalog/store/${storeId}/wh-sku/b2c?skuCode=${skuCode}`;
    try {
      const result = await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': this.configService.get<string>('rz_auth_key'),
        },
      });
      if (result.length == 0) {
        return null;
      } else {
        return result[0];
      }
    } catch (e) {
      throw new HttpException(
        { message: 'Something went wrong while fetching data from Warehouse.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveWhSkuInventory(
    storeId: string,
    createWmsB2cInventoryList: CreateWmsB2cInventoryDto[],
  ): Promise<CreateStoreWarehouseResponse> {
    try {
      const warehouseURL = `${this.configService.get<string>(
        'warehouse_url',
      )}/api/v1/catalog/store/${storeId}/wh-sku/b2c`;
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': this.configService.get<string>('rz_auth_key'),
        },
        data: createWmsB2cInventoryList,
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while updating sku in warehouse for payload : ' +
          JSON.stringify(createWmsB2cInventoryList),
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private cleanInventoryGrades(inventory: InventoryEntity) {
    if (inventory.grades != null) {
      inventory.grades = inventory.grades
        .filter((grade) => {
          return grade.name.toLowerCase() != 'default';
        })
        .map((grade) => {
          return {
            name: grade.name,
            image: grade.image,
            description: grade.description,
          };
        });
      if (inventory.grades.length == 0) {
        inventory.grades = null;
      }
    }
  }

  async getAllInventoryFromStoreId(storeId: string) {
    return await this.inventoryRepository.find({
      where: {
        store_id: storeId,
        product: { sku_type: 'DEFAULT' },
      },
      relations: ['product', 'product.category'],
    });
  }

  async updateInventoryTimeParam() {
    await this.storeParamsService.updateAndFetchParam(
      'INVENTORY_UPDATED_TIME',
      new Date(),
    );
  }

  async addInventoryUpdateLogs(
    oldInventory: InventoryEntity,
    newInventory: InventoryEntity,
  ) {
    const details =
      InventoryDetailsUpdateLogEntity.createInventoryUpdateLogEntity(
        oldInventory,
        newInventory,
        newInventory.updated_by,
      );
    await this.inventoryDetailsUpdateLogService.insertLogObject(details);
  }

  async refreshInventory(updatedAt: Date) {
    const inventoryUpdatedTime =
      await this.storeParamsService.getStringParamValue(
        'INVENTORY_UPDATED_TIME',
        null,
      );
    if (updatedAt < new Date(inventoryUpdatedTime)) {
      return {
        latestUpdatedAt: new Date(inventoryUpdatedTime),
        refreshInventory: true,
      };
    }
    return {
      latestUpdatedAt: new Date(inventoryUpdatedTime),
      refreshInventory: false,
    };
  }

  getEnablePiecesRequest(product: ProductEntity): boolean {
    if (product.unit_of_measurement == product.metadata.defaultUom) {
      return false;
    } else return product.per_pcs_suffix === product.metadata?.defaultUom;
  }

  suffixReal(perPcsSuffix): string {
    if (perPcsSuffix != null) {
      if (perPcsSuffix === 'KILOGRAM') {
        return 'kg';
      } else if (perPcsSuffix === 'PACKET') {
        return 'pack';
      } else if (perPcsSuffix === 'BUNDLE') {
        return 'bunch';
      } else {
        return 'pcs';
      }
    } else {
      return '';
    }
  }

  unitOfMeasurementString(product): string {
    // if (this.getEnablePiecesRequest(product)) {
    //   return this.suffixReal(product.per_pcs_suffix);
    // } else
    if (product.unit_of_measurement === 'KILOGRAM') {
      return 'kg';
    } else if (product.unit_of_measurement === 'PACKET') {
      return 'pack';
    } else if (product.unit_of_measurement === 'BUNDLE') {
      return 'bunch';
    } else {
      return 'pcs';
    }
  }

  async getUserAudienceMappings(userId) {
    return await this.storeService.getUserAudiences(userId);
  }

  async getAudienceSkuDiscounts(audienceIds) {
    return await this.audienceSkuDiscountRepository.findBy({
      audience_id: In(audienceIds),
      isActive: true,
    });
  }

  async handleDiscountedPrices(userId, societyId) {
    let societySkuDiscountMap = new Map<string, SkuDiscount[]>();
    let audienceSkuDiscountMap = new Map<string, SkuDiscount[]>();
    let societyDefaultDiscount = null;
    let replaceWithSkuMap = new Map<string, string>();
    if (userId) {
      const effectiveSocietyId = await this.getEffectiveSocietyId(
        userId,
        societyId,
      );
      ({ societySkuDiscountMap, societyDefaultDiscount } =
        await this.applySocietyDiscounts(
          userId,
          effectiveSocietyId,
          societySkuDiscountMap,
        ));

      const userAudienceMapping = await this.getUserAudienceMappings(userId);
      if (userAudienceMapping != null && userAudienceMapping.length) {
        ({ audienceSkuDiscountMap, replaceWithSkuMap } =
          await this.applyAudienceDiscounts(
            userAudienceMapping,
            audienceSkuDiscountMap,
          ));
      }
    }
    return {
      societySkuDiscountMap,
      audienceSkuDiscountMap,
      societyDefaultDiscount,
      replaceWithSkuMap,
    };
  }

  async getEffectiveSocietyId(userId, societyId) {
    if (societyId && societyId !== '') {
      return societyId;
    } else {
      const userAddress = await this.getUserAddressInternal(userId);
      return userAddress?.[0]?.society_id || null;
    }
  }

  async applySocietyDiscounts(userId, societyId, societySkuDiscountMap) {
    let societyDefaultDiscount = null;
    const societySkuDiscount = await this.getSocietySkuDiscount(societyId);
    if (societySkuDiscount == null) {
      return { societySkuDiscountMap, societyDefaultDiscount };
    }
    const isValidDeliveryDate =
      societySkuDiscount.validDeliveryDate == null
        ? true
        : await this.isValidDeliveryDate(societySkuDiscount.validDeliveryDate);
    if (!isValidDeliveryDate) {
      return { societySkuDiscountMap, societyDefaultDiscount };
    }
    let isEligibleForSocietyDiscount = true;
    if (societySkuDiscount?.societyId === -1) {
      isEligibleForSocietyDiscount =
        await this.isUserEligibleForSocietyDiscount(userId);
    }

    if (!isEligibleForSocietyDiscount) {
      return { societySkuDiscountMap, societyDefaultDiscount };
    }

    societyDefaultDiscount = societySkuDiscount.defaultDiscount;
    if (societySkuDiscount.skuDiscounts?.length) {
      for (const skuDiscount of societySkuDiscount.skuDiscounts) {
        const existingDiscounts =
          societySkuDiscountMap.get(skuDiscount.skuCode) || [];
        skuDiscount.isMaximumPrice = societySkuDiscount.isMaximumPrice;
        existingDiscounts.push(skuDiscount);
        societySkuDiscountMap.set(skuDiscount.skuCode, existingDiscounts);
      }
    }
    return { societySkuDiscountMap, societyDefaultDiscount };
  }

  async applyAudienceDiscounts(userAudienceMapping, audienceSkuDiscountMap) {
    const replaceWithSkuMap = new Map<string, string>();
    const audienceSkuDiscounts = await this.getAudienceSkuDiscounts(
      userAudienceMapping.map((a) => a.audienceId),
    );
    if (audienceSkuDiscounts?.length) {
      for (const audienceDiscount of audienceSkuDiscounts) {
        if (
          await this.isValidDeliveryDate(audienceDiscount.validDeliveryDate)
        ) {
          for (const skuDiscount of audienceDiscount.sku_discount) {
            if (skuDiscount.replaceWithSkuCode) {
              replaceWithSkuMap.set(
                skuDiscount.skuCode,
                skuDiscount.replaceWithSkuCode,
              );
            } else {
              skuDiscount.procurementTagExpiry = audienceDiscount.validDeliveryDate;
              const existingDiscounts =
                audienceSkuDiscountMap.get(skuDiscount.skuCode) || [];
              existingDiscounts.push(skuDiscount);
              audienceSkuDiscountMap.set(
                skuDiscount.skuCode,
                existingDiscounts,
              );
            }
          }
        }
      }
    }
    return { audienceSkuDiscountMap, replaceWithSkuMap };
  }

  async validateAudienceSkuSheetUpload(
    audienceSkuUploadBeans: AudienceSkuUploadBean[],
    validDeliveryDate: Date,
    audienceId: number,
  ) {
    const parsedAudienceSkuUploadBeans =
      new ParseResult<AudienceSkuUploadBean>();

    const skuCodes = audienceSkuUploadBeans.map(
      (audienceSkuBean) => audienceSkuBean.skuCode.trim(),
    );

    const replaceWithSkuCodes = audienceSkuUploadBeans
      .map((audienceSkuBean) => audienceSkuBean.replaceWithSkuCode)
      .filter((code) => code != null && code.trim() !== '');

    const combinedSkuCodes = [...skuCodes, ...replaceWithSkuCodes];
    const existingInventoryMap: Map<string, ProductEntity> =
      await this.productsService.getExistingProductsMap(combinedSkuCodes);

    const skuSet = new Set<string>();
    for (const audienceSkuUploadBean of audienceSkuUploadBeans) {
      const {
        skuCode,
        discount,
        discountType,
        procurementTag,
        maxQuantity,
        displayQty,
        replaceWithSkuCode,
      } = audienceSkuUploadBean;

      if (audienceId == null || isNaN(audienceId)) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Audience ID is mandatory and must be Number',
            'audienceId',
          ),
        );
      }

      if (skuCode == null || skuCode.trim() === '') {
        audienceSkuUploadBean.errors.push(
          new ErrorBean('FIELD_ERROR', 'SKU code is mandatory', 'skuCode'),
        );
      } else if (!existingInventoryMap.has(skuCode)) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'SKU code does not exist in inventory',
            'skuCode',
          ),
        );
      } else if (skuSet.has(skuCode)) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Duplicate SKU code found in sheet',
            'skuCode',
          ),
        );
      }

      if (
        discountType == null ||
        !Object.values(DiscountTypeEnum).includes(discountType)
      ) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Invalid or missing Discount Type',
            'discountType',
          ),
        );
      }

      if (procurementTag != null &&
        procurementTag.trim() === ''
      ) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Procurement Tag is mandatory',
            'procurementTag',
          ),
        );
      }

      if (maxQuantity != null &&
        (
          isNaN(maxQuantity) ||
          Number(maxQuantity) <= 0
        )
      ) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Max Quantity is mandatory and should be a positive number',
            'maxQuantity',
          ),
        );
      }

      if (
        displayQty != null &&
        (
          isNaN(displayQty) ||
          Number(displayQty) <= 0
        )
      ) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Display Quantity is mandatory and should be a positive number',
            'displayQty',
          ),
        );
      }

      if (
        replaceWithSkuCode != null &&
        replaceWithSkuCode.trim() !== '' &&
        !existingInventoryMap.has(replaceWithSkuCode)
      ) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Replace with SKU code does not exist in inventory',
            'replaceWithSkuCode',
          ),
        );
      }

      if (discount == null || isNaN(discount) || discount < 0) {
        audienceSkuUploadBean.errors.push(
          new ErrorBean(
            'FIELD_ERROR',
            'Discount is mandatory and should be a positive number',
            'discount',
          ),
        );
      } else {
        audienceSkuUploadBean.audienceId = Number(audienceId);
        audienceSkuUploadBean.discount = Number(discount);
        if (
          maxQuantity != null
        ) {
          audienceSkuUploadBean.maxQuantity = Number(maxQuantity);
        }
        if (
          displayQty != null
        ) {
          audienceSkuUploadBean.displayQty = Number(displayQty);
        }
        if (replaceWithSkuCode == null || replaceWithSkuCode.trim() === '') {
          audienceSkuUploadBean.replaceWithSkuCode = null;
        }
        skuSet.add(skuCode);
        audienceSkuUploadBean.validDeliveryDate = new Date(validDeliveryDate);
      }

      if (audienceSkuUploadBean.errors.length === 0) {
        parsedAudienceSkuUploadBeans.successRows.push(audienceSkuUploadBean);
      } else {
        parsedAudienceSkuUploadBeans.failedRows.push(audienceSkuUploadBean);
      }
    }

    return parsedAudienceSkuUploadBeans;
  }

  public async getAudienceByIds(ids: number[]) {
    const idsParam = ids.join(',');
    return await this.storeService.getAudiences(idsParam);
  }

  public async getAudienceSkuEntities(audienceIds: number[]) {
    return await this.audienceSkuDiscountRepository.findBy({
      audience_id: In(audienceIds),
      isActive: true,
    });
  }

  async saveAll(audienceSkus: AudienceSkuDiscountEntity[]) {
    return await this.audienceSkuDiscountRepository.save(audienceSkus);
  }

  async deactivateExistingAudienceDiscount(
    audienceIds: number[],
    userId: string,
  ) {
    const audienceSkuDiscounts = await this.getAudienceSkuEntities(audienceIds);
    for (const audienceSkuDiscount of audienceSkuDiscounts) {
      audienceSkuDiscount.isActive = false;
      audienceSkuDiscount.updatedBy = userId;
    }
    await this.saveAll(audienceSkuDiscounts);
  }

  async updateAudienceSkuDiscounts(
    audienceSkuUploadBeans: AudienceSkuUploadBean[],
    userId: string,
  ) {
    await this.deactivateExistingAudienceDiscount(
      audienceSkuUploadBeans.map(
        (audienceSkuBean) => audienceSkuBean.audienceId,
      ),
      userId,
    );

    const newAudienceSkuDiscounts: Map<number, AudienceSkuDiscountEntity> =
      new Map();
    for (const audienceSkuBean of audienceSkuUploadBeans) {
      let audienceSkuEntity = newAudienceSkuDiscounts.get(
        audienceSkuBean.audienceId,
      );
      if (!audienceSkuEntity) {
        audienceSkuEntity = new AudienceSkuDiscountEntity();
        audienceSkuEntity.audience_id = audienceSkuBean.audienceId;
        audienceSkuEntity.sku_discount = [];
        audienceSkuEntity.validDeliveryDate = audienceSkuBean.validDeliveryDate;
        audienceSkuEntity.updatedBy = userId;
        newAudienceSkuDiscounts.set(
          audienceSkuBean.audienceId,
          audienceSkuEntity,
        );
      }

      const skuDiscount: SkuDiscount = {
        skuCode: audienceSkuBean.skuCode,
        discount: audienceSkuBean.discount,
        discountType: audienceSkuBean.discountType,
        procurementTag: audienceSkuBean.procurementTag,
        maxQuantity: audienceSkuBean.maxQuantity,
        displayQty: audienceSkuBean.displayQty,
        replaceWithSkuCode: audienceSkuBean.replaceWithSkuCode,
      };
      audienceSkuEntity.sku_discount.push(skuDiscount);
    }

    const audienceSkus = Array.from(newAudienceSkuDiscounts.values());
    this.saveAll(audienceSkus);
  }

  async isValidDeliveryDate(date) {
    const deliveryDate = new Date(date);
    deliveryDate.setHours(0, 0, 0, 0);
    const addToCartDate = await this.getAddToCartDate();
    return deliveryDate > addToCartDate;
  }

  async getAddToCartDate(): Promise<Date> {
    const utcNow = new Date();

    const timeToAdd = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const adjustedUtcNow = new Date(utcNow.getTime() + timeToAdd);

    const cutOffTime = await this.storeParamsService.getStringParamValue(
      'ADD_TO_CART_CUTOFF_TIME',
      '05:00:00',
    );
    const [cutoffHours, cutoffMinutes, cutoffSeconds] = cutOffTime
      .split(':')
      .map(Number);

    const cutoffUTC = new Date();
    const adjustedCutoffUTC = new Date(cutoffUTC.getTime() + timeToAdd);
    adjustedCutoffUTC.setHours(cutoffHours, cutoffMinutes, cutoffSeconds);

    let addToCartDate: Date;

    if (adjustedUtcNow < adjustedCutoffUTC) {
      addToCartDate = new Date(adjustedUtcNow);
      addToCartDate.setUTCDate(addToCartDate.getUTCDate() - 1);
    } else {
      addToCartDate = new Date(adjustedUtcNow);
    }
    return addToCartDate;
  }

  async validateAvailableQty(
    inventoryItem: InventoryEntity,
    reqBodyQty: number,
  ) {
    const availableQty: number =
      inventoryItem.quantity + (reqBodyQty - inventoryItem.total_quantity);
    if (availableQty < 0) {
      return false;
    }
    if (inventoryItem.total_quantity != reqBodyQty) {
      inventoryItem.metadata.resetQty = reqBodyQty;
    }
    inventoryItem.quantity = availableQty;
    return inventoryItem;
  }

  replaceSku(
    replaceWithSkuMap,
    inventoryItem: InventoryEntity,
    replaceSkuInventoryItems,
    replaceSkuProductItems,
  ) {
    if (replaceWithSkuMap.has(inventoryItem.sku_code)) {
      if (
        replaceSkuInventoryItems.has(
          replaceWithSkuMap.get(inventoryItem.sku_code),
        ) &&
        replaceSkuProductItems.has(
          replaceWithSkuMap.get(inventoryItem.sku_code),
        )
      ) {
        const replaceSkuCode = replaceWithSkuMap.get(inventoryItem.sku_code);
        Object.assign(
          inventoryItem,
          replaceSkuInventoryItems.get(replaceSkuCode),
        );
        inventoryItem.is_complimentary = false;
        Object.assign(
          inventoryItem.product,
          replaceSkuProductItems.get(replaceSkuCode),
        );
        return true;
      }
    }
    return false;
  }

  async freezeSocietySkuPrice(userId: string) {
    let societyExpiryDtos = (await this.storeParamsService.getJsonParamValue(
      'SOCIETY_EXPIRY',
      null,
    )) as SocietyExpiryDto[];
    if (societyExpiryDtos == null || societyExpiryDtos.length == 0) {
      return;
    }
    const currentIstDate = this.commonService
      .getCurrentIstMomentDateTime()
      .toDate();
    societyExpiryDtos = societyExpiryDtos.filter(
      (societyExpiryDto) =>
        new Date(societyExpiryDto.validDeliveryDate) > currentIstDate,
    );
    if (societyExpiryDtos == null || societyExpiryDtos.length == 0) {
      return;
    }
    const societyIds = societyExpiryDtos.map(
      (societyExpiryDto) => societyExpiryDto.societyId,
    );
    const societyDtos = await this.storeService.getSocietyDtos(societyIds);
    if (societyDtos == null || societyDtos.length == 0) {
      return;
    }
    //deactivate existing society sku discounts
    await this.deactivateExistingSocietySkuDiscounts(societyIds, userId);
    const societyStoreMap = new Map<number, string>(
      societyDtos.map((dto) => [dto.id, String(dto.storeId)]),
    );
    const inventories = await this.getInventoryByStoreIds(
      societyDtos.map((societyEntity) => String(societyEntity.storeId)),
    );
    const storeInventoryMap = new Map<string, InventoryEntity[]>();
    inventories.forEach((inventory) => {
      if (!storeInventoryMap.has(inventory.store_id)) {
        storeInventoryMap.set(inventory.store_id, []);
      }
      storeInventoryMap.get(inventory.store_id).push(inventory);
    });
    const societySkuEntities = [];
    for (const societyExpiryDto of societyExpiryDtos) {
      const categories = new Set<string>(societyExpiryDto.categories);
      const inventory = storeInventoryMap.get(
        societyStoreMap.get(Number(societyExpiryDto.societyId)),
      );
      if (inventory == null || inventory.length == 0) {
        continue;
      }
      const societySkuDiscountList = [];
      for (const inventoryItem of inventory) {
        if (
          categories == null ||
          categories.size === 0 ||
          inventoryItem.product?.consumer_contents?.classes?.some((cls) =>
            categories.has(cls),
          )
        ) {
          const skuDiscount = new SkuDiscount();
          skuDiscount.skuCode = inventoryItem.sku_code;
          skuDiscount.discountType = DiscountTypeEnum.FLAT;
          skuDiscount.discount = inventoryItem.sale_price;
          societySkuDiscountList.push(skuDiscount);
        }
      }

      const societySkuDiscountEntity = new SocietySkuDiscountEntity();
      societySkuDiscountEntity.societyId = societyExpiryDto.societyId;
      societySkuDiscountEntity.defaultDiscount = 0;
      societySkuDiscountEntity.validDeliveryDate =
        societyExpiryDto.validDeliveryDate;
      societySkuDiscountEntity.skuDiscounts = societySkuDiscountList;
      societySkuDiscountEntity.isMaximumPrice = true;
      societySkuDiscountEntity.createdAt = new Date();
      societySkuDiscountEntity.updatedAt = new Date();
      societySkuDiscountEntity.updatedBy = userId;
      societySkuEntities.push(societySkuDiscountEntity);
    }
    this.saveAllSocietySkuDiscount(societySkuEntities);
  }

  private async deactivateExistingSocietySkuDiscounts(
    societyIds: number[],
    userId: string,
  ) {
    const societySkuDiscounts = await this.getSocietySkuDiscountBySocietyIds(
      societyIds,
    );
    if (societySkuDiscounts !== null && societySkuDiscounts.length > 0) {
      societySkuDiscounts.forEach((societySkuDiscount) => {
        societySkuDiscount.isActive = false;
        societySkuDiscount.updatedBy = userId;
        societySkuDiscount.updatedAt = new Date();
      });
    }
    await this.saveAllSocietySkuDiscount(societySkuDiscounts);
  }

  async saveAllSocietySkuDiscount(
    societySkuDiscounts: SocietySkuDiscountEntity[],
  ) {
    return await this.societySkuDiscountRepository.save(societySkuDiscounts);
  }

  async getSocietySkuDiscountBySocietyIds(societyIds: number[]) {
    return await this.societySkuDiscountRepository.findBy({
      societyId: In(societyIds),
      isActive: true,
    });
  }

  private async addSkuInSocietySkuDiscount(
    inventoryItem: InventoryEntity,
    userId: string,
  ) {
    const societySkuDiscount = await this.getMaximumPriceSocietySkuDiscount();
    if (societySkuDiscount == null || societySkuDiscount.length == 0) {
      return;
    }
    const societyIds = societySkuDiscount.map(
      (societySkuDiscount) => societySkuDiscount.societyId,
    );
    const societyDtos = await this.storeService.getSocietyDtos(societyIds);
    if (societyDtos == null || societyDtos.length == 0) {
      return;
    }

    const societyStoreMap = new Map<number, string>(
      societyDtos.map((dto) => [dto.id, String(dto.storeId)]),
    );

    const product = await this.productsService.getBySkuCode(
      inventoryItem.sku_code,
    );

    let societyExpiryDtos = (await this.storeParamsService.getJsonParamValue(
      'SOCIETY_EXPIRY',
      null,
    )) as SocietyExpiryDto[];
    const societyCategoryMap = new Map<number, Set<string>>();
    if (societyExpiryDtos != null && societyExpiryDtos.length > 0) {
      societyExpiryDtos.forEach((societyExpiryDto) => {
        if (
          societyExpiryDto.categories != null &&
          societyExpiryDto.categories.length > 0
        ) {
          societyCategoryMap.set(
            Number(societyExpiryDto.societyId),
            new Set<string>(societyExpiryDto.categories),
          );
        } else {
          societyCategoryMap.set(
            Number(societyExpiryDto.societyId),
            new Set<string>(),
          );
        }
      });
    }

    for (const entity of societySkuDiscount) {
      const skuDiscount = new SkuDiscount();
      const categories = societyCategoryMap.get(entity.societyId);
      if (
        categories == null ||
        categories.size === 0 ||
        product?.consumer_contents?.classes?.some((cls) => categories.has(cls))
      ) {
        if (societyStoreMap.get(entity.societyId) === inventoryItem.store_id) {
          skuDiscount.skuCode = inventoryItem.sku_code;
          skuDiscount.discountType = DiscountTypeEnum.FLAT;
          skuDiscount.discount = inventoryItem.sale_price;
          entity.skuDiscounts.push(skuDiscount);
          entity.updatedAt = new Date();
          entity.updatedBy = userId;
        }
      }
    }
    this.saveAllSocietySkuDiscount(societySkuDiscount);
  }

  async getMaximumPriceSocietySkuDiscount() {
    return await this.societySkuDiscountRepository.find({
      where: {
        isMaximumPrice: true,
        isActive: true,
        validDeliveryDate: MoreThan(
          this.commonService.getCurrentIstMomentDateTime().toDate(),
        ),
      },
    });
  }

  async getInventoryByStoreIds(storeIds: string[]) {
    return await this.inventoryRepository.find({
      where: {
        store_id: In(storeIds),
        product: { sku_type: 'DEFAULT' },
      },
      relations: ['product', 'product.category'],
    });
  }

  async getCategoryResponse(
    storeId: string,
    isAllCategoryVersion: boolean,
  ) {
    const categories = await this.categoryService.getAllCategories();
    if (!categories || categories.length === 0) {
      return null;
    }

    let validCategories: Categories[] = categories.filter((category) => {
      if (!category.metadata) return true;

      const { visibleToStoreIds, hideForStoreIds } = category.metadata;
      const isVisible =
        !visibleToStoreIds ||
        visibleToStoreIds.length === 0 ||
        visibleToStoreIds.includes(storeId);
      const isHidden = hideForStoreIds && hideForStoreIds.includes(storeId);

      return isVisible && !isHidden;
    });

    if (validCategories.length < 4) {
      validCategories = categories;
    }
    validCategories = validCategories.sort(
      (a, b) => (a.priority || 0) - (b.priority || 0),
    );
    if (
      validCategories.length > 4 &&
      !isAllCategoryVersion
    ) {
      validCategories = validCategories.slice(0, 4);
    }
    validCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
    let categoryRes: CategoryResponseDto[] =
      validCategories.map((category) => ({
        id: category.id,
        name: category.name,
        displayName: category.display_name,
        pluralName: category.metadata?.pluralName || category.display_name,
      }));
    return categoryRes;
  }

  updateProductConsumerClasses(
    product: ProductEntity,
    isDairyVisible: boolean,
  ) {
    if (
      isDairyVisible &&
      product?.consumer_contents?.classes?.includes(CATEGORIES.SPREADS)
    ) {
      product.consumer_contents.classes = [CATEGORIES.EXOTIC];
    } else if (
      !isDairyVisible &&
      product?.consumer_contents?.classes?.length > 1 &&
      product?.consumer_contents?.classes?.includes(CATEGORIES.DAIRY)
    ) {
      product.consumer_contents.classes =
        product.consumer_contents.classes.filter((c) => c !== CATEGORIES.DAIRY);
    }
    if (product?.consumer_contents?.classes?.length > 1) {
      product.consumer_contents.classes = [
        product.consumer_contents.classes[0],
      ];
    }
  }

  isDairyCategoryVisible(categoryResponse: any[]): boolean {
    return categoryResponse.some(
      (category) => category.name === CATEGORIES.DAIRY,
    );
  }

  async moveSpreadToExotic(
    inventoryData: InventoryItemResponse[],
    categoryResponse: any[],
  ) {
    const isDairyVisible = this.isDairyCategoryVisible(categoryResponse);
    inventoryData.forEach((inv) => {
      const product = inv.product;
      this.updateProductConsumerClasses(product, isDairyVisible);
    });
  }

  async isAllCategoryVersion(appVersion: string) {
    if (appVersion == null) {
      return false;
    }
    const allCategoryVersion =
      await this.storeParamsService.getStringParamValue('ALL_CATEGORY_VERSION', '1.1.108');
    return this.commonService.isVersionGreaterOrEqual(appVersion, allCategoryVersion);
  }

  filterInventoryByActiveCategories(
    inventoryRes: InventoryItemResponse[],
    categoryResponse: CategoryResponseDto[],
  ) {
    const activeCategoryIds = new Set(categoryResponse.map(category => category.id));
    return inventoryRes.filter(invItem => activeCategoryIds.has(invItem.product.category_id));
  }
}
