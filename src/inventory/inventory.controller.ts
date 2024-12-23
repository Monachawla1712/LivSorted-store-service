import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/common/http-exception.filter';
import { CreateInventoryDto } from './dto/createInventory.dto';
import { UpdateInventoryDto } from './dto/updateInventory.dto';
import { XLXSReqBodyDto } from '../common/dto/xlsxReqBody.dto';
import { UpdateMultipleSkusDto } from './dto/updateMultipleSkus.dto';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryService } from './inventory.service';
import { StoreService } from '../store/store.service';
import { StoreEntity } from '../store/entity/store.entity';
import { StoreResponse } from '../store/dto/store-response.dto';
import { ValueSkuCodeMapObject } from './dto/valueSkuCode.dto';
import { InventoryItemResponse } from './dto/inventory-item-response.dto';
import { InventoryParams } from './dto/inventoryParams.dto';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { CustomLogger } from '../common/custom-logger';
import { ProductsService } from '../products/products.service';
import { ProductEntity } from '../products/entity/products.entity';
import { FindOptionsWhere } from 'typeorm';
import { CommonService } from '../common/common.service';
import { ProductListItemResponse } from '../products/dto/productListResponse.dto';
import { InventoryListItemResponse } from '../products/dto/InventoryListItemResponse.dto';
import { CreatePosProductDto } from './dto/createPosProduct.dto';
import { UpdatePosInventoryDto } from './dto/updatePosInventory.dto';
import { MapMasterToInventoryDto } from './dto/MapMasterToInventory.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { InventoryPricingUploadBean } from './dto/inventory-pricing-upload.bean';
import { ParseResult } from '../common/dto/parse-result';
import { InventoryMovementDto } from './dto/inventoryMovement.dto';
import { InventoryType } from './enum/inventoryType.enum';
import { InventoryReceptionDto } from './dto/inventoryReception.dto';
import { InventoryAdjustmentDto } from './dto/inventoryAdjustment.dto';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/configuration';
import { BackofficeInventoryUploadBean } from './dto/backoffice-inventory-upload.bean';
import { StoreParamsService } from '../store-params/store-params.service';
import { PriceBracketDto } from './dto/priceBracket.dto';
import { WarehouseSkuB2cBean } from './dto/warehouse-sku-b2c-bean';
import { SearchService } from '../search/search.service';
import { InternalGetInventoryResponse } from './dto/internal.responses.dto';
import { InventoryMetadataDto } from './dto/inventory-metadata.dto';
import { PricingType } from './enum/pricingType.enum';
import { AudienceSkuUploadBean } from './dto/audience-sku-upload.bean';
import { LocalCache } from 'src/common/utils/local-cache-utils';
import { CACHE_KEYS } from 'src/cache/cache-constants';
import { DURATION_IN_SECOND } from 'src/common/constants/common-constants';
import { classToPlain } from 'class-transformer';

@Controller()
@ApiTags('Inventory')
@UseFilters(HttpExceptionFilter)
export class InventoryController {
  private readonly logger = new CustomLogger(InventoryController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private inventoryService: InventoryService,
    private storeParamsService: StoreParamsService,
    private productsService: ProductsService,
    private searchService: SearchService,
    private storeService: StoreService,
    private commonService: CommonService,
    private configService: ConfigService<Config, true>,
  ) {}

  @ApiResponse({ type: [InventoryEntity] })
  @ApiParam({ name: 'whId', required: true })
  @Get('inventory/warehouse/:whId')
  getAllInventoriesByWhIdAdmin(@Param('whId') whId) {
    return this.inventoryService.getAllInventoryByWhIdAdmin(whId);
  }

  @ApiResponse({ type: [InventoryEntity] })
  @Get('inventory/v3')
  async getAllInventoryV3(
    @Headers('storeId') storeId: string,
    @Headers('userId') userId: string,
    @Headers('societyId') societyId: number,
    @Headers('appVersion') appVersion: string,
  ) {
    const store = await this.getStore(storeId);
    if (!store) return this.storeNotFoundResponse();

    const inventoryData =
      await this.inventoryService.getDefaultInventoryFromStoreId(storeId);
    const inventoryParams = await this.inventoryService.initInventoryParams();
    const inventoryDataWithoutProductContent = [];

    const result = await this.processInventory(
      inventoryData,
      inventoryParams,
      userId,
      storeId,
      societyId,
      appVersion,
      true,
    );
    const isAllCategoryVersion = await this.inventoryService.isAllCategoryVersion(appVersion);
    const refreshInventory = await this.inventoryService.refreshInventory(null);
    const categoryResponse = await this.inventoryService.getCategoryResponse(
      storeId,
      isAllCategoryVersion,
    );
    if (!isAllCategoryVersion) {
      await this.inventoryService.moveSpreadToExotic(
        result.inventory,
        categoryResponse,
      );
    } else if (isAllCategoryVersion) {
      result.inventory =
        this.inventoryService.filterInventoryByActiveCategories(
          result.inventory,
          categoryResponse,
        );
    }
    const inventory = {
      store: { storeId: storeId },
      ...result,
      latestUpdatedAt: refreshInventory?.latestUpdatedAt,
      categoryResponse: categoryResponse,
      showRepeatOrderSection:
        this.inventoryService.isDairyCategoryVisible(categoryResponse),
    };
    return classToPlain(inventory);
  }

  @ApiResponse({ type: [InventoryEntity] })
  @Get('inventory/v3/backoffice')
  async getAllInventoryV3BackOffice(@Headers('storeId') storeId: string) {
    const { store, storeResponse } = await this.getStoreAndResponse(storeId);
    if (!store) return this.storeNotFoundResponse();

    const inventoryData =
      await this.inventoryService.getAllDefaultInventoryFromStoreId(storeId);
    const productSynonymMap =
      await this.searchService.getSynonymsForAllProductCode();
    const inventoryParams = await this.inventoryService.initInventoryParams();

    const result = await this.processInventory(
      inventoryData,
      inventoryParams,
      null,
      storeId,
      null,
      null,
      false,
      productSynonymMap,
    );

    this.sortInventory(
      result.inventory,
      inventoryParams.defaultSortingTag,
      inventoryParams.sortingDirection,
    );

    return {
      store: storeResponse,
      ...result,
    };
  }

  private async getStore(storeId: string): Promise<{ store: StoreEntity }> {
    const cacheKey = CACHE_KEYS.StoreCachePrefix + storeId;
    const storeDetails = LocalCache.getValue(cacheKey);
    if (storeDetails) {
      return storeDetails;
    }
    if (!storeId) {
      storeId = await this.storeParamsService.getStringParamValue(
        'DEFAULT_STORE_ID',
        '10001',
      );
    }
    const store = await this.storeService.getStoreFromStoreId(storeId);
    LocalCache.setValue(cacheKey, { store }, DURATION_IN_SECOND.HR_8);
    return { store };
  }

  private async getStoreAndResponse(
    storeId: string,
  ): Promise<{ store: StoreEntity; storeResponse: StoreResponse }> {
    const cacheKey = CACHE_KEYS.StoreResponseCachePrefix + storeId;
    const storeDetails = LocalCache.getValue(cacheKey);
    if (storeDetails) {
      return storeDetails;
    }
    if (!storeId) {
      storeId = await this.storeParamsService.getStringParamValue(
        'DEFAULT_STORE_ID',
        '10001',
      );
    }
    const store = await this.storeService.getStoreFromStoreId(storeId);
    const storeResponse = store
      ? await this.storeService.buildStoreResponse(store, 0)
      : null;
    LocalCache.setValue(
      cacheKey,
      { store, storeResponse },
      DURATION_IN_SECOND.HR_8,
    );
    return { store, storeResponse };
  }

  private async processInventory(
    inventoryData: any[],
    inventoryParams: any,
    userId: string,
    storeId: string,
    societyId: any,
    appVersion: string,
    isConsumerAppResponse: boolean,
    productSynonymMap?: Map<string, string>,
  ) {
    const inventory = [];
    const filteredInventoryMap = new Map<string, string[]>();
    const valuedTagsArrayMap = new Map<string, ValueSkuCodeMapObject[]>();
    const inventoryTagsImagesMap = new Map<string, string>();
    const {
      societySkuDiscountMap,
      audienceSkuDiscountMap,
      societyDefaultDiscount,
      replaceWithSkuMap,
    } = await this.inventoryService.handleDiscountedPrices(userId, societyId);
    const replaceSkuInventoryItems =
      await this.inventoryService.getInventoryMapFromStoreIdAndSkuCodes(
        storeId,
        Array.from(replaceWithSkuMap.values()),
      );
    const replaceSkuProductItems =
      await this.productsService.getExistingProductsMap(
        Array.from(replaceWithSkuMap.values()),
      );
    for (const e of inventoryData) {
      if (this.shouldProcessInventoryItem(e, inventoryParams)) {
        const isReplaced = this.inventoryService.replaceSku(
          replaceWithSkuMap,
          e,
          replaceSkuInventoryItems,
          replaceSkuProductItems,
        );
        const inventData = { ...e };
        if (
          isConsumerAppResponse &&
          inventData.product?.metadata?.contents?.length
        ) {
          inventData.product.metadata.contents = [];
        }
        const inventoryItemResponse =
          await this.inventoryService.buildInventoryItemResponse(
            inventData,
            inventoryParams,
            productSynonymMap || null,
            societyDefaultDiscount,
            societySkuDiscountMap,
            audienceSkuDiscountMap,
            isReplaced,
            Number.parseInt(storeId),
            appVersion,
          );
        inventory.push(inventoryItemResponse);
        this.fillTagMaps(
          e,
          inventoryParams,
          filteredInventoryMap,
          valuedTagsArrayMap,
          inventoryTagsImagesMap,
        );
      }
    }

    /*
    Not used in App, so commenting out this code
    const sortedInventory = await this.getSortedInventoryMap(
      valuedTagsArrayMap,
    );
    const filteredInventory = await this.getFilteredInventoryMap(
      filteredInventoryMap,
    );
    const inventoryTagsImage = await this.getInventoryTagsImageList(
      inventoryTagsImagesMap,
     );
    */

    return {
      inventory,
      sorted_inventory: new Map(), //Object.fromEntries(sortedInventory),
      filtered_inventory: new Map(), //Object.fromEntries(filteredInventory),
      inventory_tags_image: [],
    };
  }

  private shouldProcessInventoryItem(item: any, inventoryParams: any): boolean {
    return (
      item.product.is_active &&
      !inventoryParams.hiddenSkusSet.has(item.product.sku_code) &&
      (item.quantity > 0 || inventoryParams.showOutOfStock !== 2)
    );
  }

  @Get('inventory/complimentary/skus')
  @ApiResponse({ status: 200, type: InternalGetInventoryResponse })
  async getComplimentarySKus(@Headers('societyId') societyId: string) {
    const societyDetails = await this.inventoryService.getSocietyDetailsById(
      societyId,
    );
    if (societyDetails == null) {
      throw new HttpException(
        { message: 'Given Society does not exist' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const storeId = societyDetails.storeId;
    const complimentaryStr = await this.storeParamsService.getStringParamValue(
      'COMPLEMENTARY_SKUS_' + storeId,
      '',
    );
    if (complimentaryStr != '') {
      const skuCodeToQtyMap = new Map();
      complimentaryStr.split(',').forEach((item) => {
        const [key, value] = item.split(':');
        skuCodeToQtyMap.set(key, parseFloat(value));
      });
      const skus = Array.from(skuCodeToQtyMap.keys());
      const inventoryResponse = await this.inventoryService.getInventory(
        storeId,
        skus,
        false,
        null,
        null,
      );
      if (inventoryResponse) {
        const updatedInventoryResponse = (
          inventoryResponse as InventoryEntity[]
        ).map((item) => ({
          ...item, // Copy existing properties from the original object
          complementary_qty: skuCodeToQtyMap.get(item.sku_code),
        }));
        return updatedInventoryResponse;
      }
      return inventoryResponse;
    } else {
      throw new HttpException(
        { message: 'No Complementary skus exist for this society' },
        HttpStatus.NO_CONTENT,
      );
    }
  }

  @Get('inventory/admin')
  async getAllInventoryAdmin(@Headers('storeId') storeId: string) {
    let store: StoreEntity = null;
    let storeResponse: StoreResponse = null;
    if (storeId == null) {
      storeId = await this.storeParamsService.getStringParamValue(
        'DEFAULT_STORE_ID',
        '10001',
      );
    }
    store = await this.storeService.getStoreFromStoreId(storeId);
    if (store == null) {
      return this.storeNotFoundResponse();
    }
    storeResponse = await this.storeService.buildStoreResponse(store, 0);
    const inventoryData =
      await this.inventoryService.getAllInventoryFromStoreId(storeId);
    const inventoryParams = await this.inventoryService.initInventoryParams();
    const inventory = [];
    for (const e of inventoryData) {
      const inventoryItemResponse =
        await this.inventoryService.buildInventoryItemResponse(
          e,
          inventoryParams,
          null,
          null,
          null,
          null,
          false,
          null,
          null,
        );
      inventory.push(inventoryItemResponse);
    }
    this.sortInventory(
      inventory,
      inventoryParams.defaultSortingTag,
      inventoryParams.sortingDirection,
    );
    return {
      store: storeResponse,
      inventory: inventory,
    };
  }

  async getSortedInventoryMap(valuedTagsArrayMap) {
    const sortedInventory = new Map<string, object>();
    for (const [displayName, tagValueArray] of valuedTagsArrayMap) {
      tagValueArray.sort((valueTag1, valueTag2) => {
        return valueTag2.value - valueTag1.value;
      });
      const skuCodeSequenceMap = new Map<string, number>();
      for (let i = 0; i < tagValueArray.length; i++) {
        const tagValueObject = tagValueArray.at(i);
        skuCodeSequenceMap.set(tagValueObject.sku_code, i);
      }
      sortedInventory.set(displayName, Object.fromEntries(skuCodeSequenceMap));
    }
    return sortedInventory;
  }

  async getFilteredInventoryMap(filteredInventoryMap) {
    const filteredInventory = new Map<string, object>();
    for (const [displayName, filterArray] of filteredInventoryMap) {
      const skuCodeSequenceMap = new Map<string, number>();
      for (let i = 0; i < filterArray.length; i++) {
        const skuCode = filterArray.at(i);
        skuCodeSequenceMap.set(skuCode, i);
      }
      filteredInventory.set(
        displayName,
        Object.fromEntries(skuCodeSequenceMap),
      );
    }
    return filteredInventory;
  }

  async getInventoryTagsImageList(inventoryTagsImagesMap) {
    const inventoryTagsImageList = [];
    for (const [displayName, imageUrl] of inventoryTagsImagesMap) {
      inventoryTagsImageList.push({
        display_name: displayName,
        image_url: imageUrl,
      });
    }
    return inventoryTagsImageList;
  }

  private fillTagMaps(
    inventory: InventoryEntity,
    inventoryParams: InventoryParams,
    filteredInventoryMap: Map<string, string[]>,
    valuedTagsArrayMap: Map<string, ValueSkuCodeMapObject[]>,
    inventoryTagsImagesMap: Map<string, string>,
  ) {
    for (const tag of inventory.product.metadata.contents) {
      if (tag.display_name != null) {
        inventoryTagsImagesMap.set(tag.display_name, tag.image_url);
        if (
          tag.value != null &&
          inventoryParams.sortingTagsSet.has(tag.display_name)
        ) {
          const valueObject = new ValueSkuCodeMapObject(
            tag.value,
            inventory.sku_code,
          );
          if (!valuedTagsArrayMap.has(tag.display_name)) {
            valuedTagsArrayMap.set(tag.display_name, [valueObject]);
          } else {
            valuedTagsArrayMap.get(tag.display_name).push(valueObject);
          }
        } else if (inventoryParams.filterTagsSet.has(tag.display_name)) {
          if (!filteredInventoryMap.has(tag.display_name)) {
            filteredInventoryMap.set(tag.display_name, [inventory.sku_code]);
          } else {
            filteredInventoryMap.get(tag.display_name).push(inventory.sku_code);
          }
        }
      }
    }
  }

  private sortInventory(
    inventory: InventoryItemResponse[],
    sortingTag: string,
    sortingDirection: number,
  ) {
    inventory.sort((i1: InventoryEntity, i2: InventoryEntity) => {
      const value1 = this.getTagValue(i1, sortingTag);
      const value2 = this.getTagValue(i2, sortingTag);
      return sortingDirection * (value1 - value2);
    });
  }

  private getTagValue(i1: InventoryEntity, sortingTag: string): number {
    for (const productTag of i1.product.metadata.contents) {
      if (productTag['display_name'] == sortingTag) {
        return productTag['value'];
      }
    }
    return 0;
  }

  @Get('inventory/warehouse')
  async getWmsSku(@Query('storeId') storeId, @Query('skuCode') skuCode) {
    return await this.inventoryService.fetchWhSkuInventoryBySkuCode(
      storeId,
      skuCode,
    );
  }

  @ApiBody({ type: CreateInventoryDto })
  @Post('inventory')
  @ApiResponse({ type: InventoryEntity })
  async createInventory(
    @Body() reqBody: CreateInventoryDto,
    @Headers('userId') userId: string,
  ) {
    if (reqBody.quantity < 0) {
      throw new HttpException(
        { message: 'inventory quantity can not be negative' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (reqBody.price_brackets != null && reqBody.price_brackets.length > 0) {
      if (!this.areValidPriceBrackets(reqBody.price_brackets)) {
        throw new HttpException(
          { message: 'input price brackets are invalid' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    this.validateOzoneWashingCharges(
      reqBody.is_ozone_washed_item,
      reqBody.ozone_washing_charges,
    );
    const inventories = [];
    for (const storeId of reqBody.stores) {
      const whSkuInventory =
        await this.inventoryService.fetchWhSkuInventoryBySkuCode(
          storeId,
          reqBody.sku_code,
        );
      const inv = await this.inventoryService.createInventory(
        reqBody,
        whSkuInventory,
        true,
        userId,
        storeId,
      );
      inventories.push(inv);
    }
    return inventories;
  }

  validateOzoneWashingCharges(
    isOzoneWashedItem: boolean,
    ozoneWashingCharges: number,
  ) {
    if (isOzoneWashedItem && isOzoneWashedItem == true) {
      if (!ozoneWashingCharges || ozoneWashingCharges <= 0) {
        throw new HttpException(
          { message: 'ozone washing charges are invalid' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  areValidPriceBrackets(priceBrackets: PriceBracketDto[]) {
    priceBrackets.sort((pb1, pb2) => {
      return pb1.min - pb2.min;
    });
    let previousMax = null;
    for (let i = 0; i < priceBrackets.length; i++) {
      const priceBracket = priceBrackets.at(i);

      const min = Number(priceBracket.min.toFixed(2));
      priceBracket.min = min;

      const max = Number(priceBracket.max.toFixed(2));
      priceBracket.max = max;

      if (
        min < 0 ||
        max < min ||
        (previousMax !== null && min !== previousMax) ||
        (i === 0 && min !== 0) ||
        (i === priceBrackets.length - 1 && max <= 50000)
      ) {
        return false;
      } else {
        previousMax = max;
      }
    }
    return true;
  }

  @ApiResponse({ type: [InventoryEntity] })
  @ApiParam({ name: 'storeId', required: true })
  @Get('inventory/:storeId')
  getAllInventoryByAdmin(@Param('storeId') storeId) {
    return this.inventoryService.getAllInventoryByAdmin(storeId);
  }

  @ApiBody({ type: [UpdateInventoryDto] })
  @ApiResponse({ type: InventoryEntity })
  @ApiParam({ name: 'inventoryId', required: true })
  @Patch('inventory/:inventoryId')
  async updateInventory(
    @Body() reqBody,
    @Param('inventoryId') inventoryId,
    @Headers('userId') userId: string,
  ) {
    const inventory = await this.inventoryService.findInventoryById(
      inventoryId,
    );
    if (inventory == null) {
      throw new HttpException(
        { message: 'inventory not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return await this.processInventoryUpdate(inventory, reqBody, userId);
  }

  @Patch('inventory')
  async updateWhInventories(
    @Body() reqBody,
    @Query('skuCode') skuCode,
    @Query('whId') whId,
    @Headers('userId') userId: string,
  ) {
    const inventories = await this.inventoryService.findBySkuCodeAndWhId(
      skuCode,
      whId,
    );
    if (inventories == null || inventories.length === 0) {
      throw new HttpException(
        { message: 'inventory not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(
      inventories.map((inventory) =>
        this.processInventoryUpdate(inventory, reqBody, userId),
      ),
    );
  }

  private async processInventoryUpdate(inventory, reqBody, userId: string) {
    if (reqBody.quantity && reqBody.quantity < 0) {
      throw new HttpException(
        { message: 'inventory quantity can not be negative' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const inventoryDetails = JSON.parse(JSON.stringify(inventory));
    inventory.updated_by = userId;
    let availableQty: number = inventory.quantity;
    if (reqBody.quantity != null && reqBody.quantity >= 0) {
      const availableItem = await this.inventoryService.validateAvailableQty(
        inventory,
        reqBody.quantity,
      );
      if (!availableItem) {
        throw new HttpException(
          { message: 'Cart Qty is greater than Inventory Qty' },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (reqBody.resetQty == null) {
        reqBody.resetQty =
          reqBody.quantity != inventory.total_quantity
            ? reqBody.quantity
            : inventory.metadata.resetQty;
      }
      inventory.total_quantity = reqBody.quantity;
      availableQty = availableItem.quantity;
    }
    if (reqBody.price_brackets != null && reqBody.price_brackets.length > 0) {
      if (!this.areValidPriceBrackets(reqBody.price_brackets)) {
        throw new HttpException(
          { message: 'input price brackets are invalid' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    this.validateOzoneWashingCharges(
      reqBody.is_ozone_washed_item,
      reqBody.ozone_washing_charges,
    );
    this.updateInventoryMetadata(
      inventory,
      reqBody.ozone_washing_charges,
      reqBody.cutoffTime,
      reqBody.resetQty,
      reqBody.is_ozone_washed_item,
    );
    this.patchInventory(inventory, reqBody);
    inventory.quantity = availableQty;
    const whSkuInventory =
      await this.inventoryService.fetchWhSkuInventoryBySkuCode(
        inventory.store_id,
        inventory.sku_code,
      );
    return this.inventoryService.updateInventory(
      inventoryDetails,
      inventory,
      whSkuInventory,
      reqBody,
    );
  }

  @Post('inventory/xlsx')
  @ApiBody({ type: XLXSReqBodyDto })
  uploadCsv(
    @Body() reqBody: XLXSReqBodyDto,
    @Headers('userId') createdBy: string,
  ) {
    return this.inventoryService.xlsxBulkInventoryCreate(
      reqBody.fileName,
      createdBy,
    );
  }

  @Post('inventory/bulk')
  @ApiBody({ type: UpdateMultipleSkusDto })
  updateMultipleSkus(
    @Body() reqBody: UpdateMultipleSkusDto,
    @Headers('userId') updatedBy: string,
  ) {
    return this.inventoryService.updateMultipleSkus(reqBody, updatedBy);
  }

  @Post('inventory/reset')
  async resetInventory(@Query('storeId') storeId: string) {
    if (!storeId) return HttpStatus.UNPROCESSABLE_ENTITY;
    await this.inventoryService.resetInventory(storeId);
    return HttpStatus.CREATED;
  }

  @Post('inventory/price-update')
  async refreshInventoryPrices(@Headers('userId') userId: string) {
    const filter = {
      store_type: 'DARK',
    };
    const darkStores = await this.storeService.getStores(filter, null);
    for (const store of darkStores) {
      const inventoryData =
        await this.inventoryService.getAllInventoryFromStoreId(store.store_id);
      for (const item of inventoryData) {
        const inventoryDetails = { ...item };
        if (item.metadata.nextDayMarketPrice) {
          item.market_price = item.metadata.nextDayMarketPrice;
        }
        if (item.metadata.nextDaySalePrice) {
          item.sale_price = item.metadata.nextDaySalePrice;
        }
        if (item.metadata.marketingSalePrice) {
          item.metadata.marketingSalePrice = null;
          item.metadata.marketingDisplayQty = null;
        }
        item.quantity = item.metadata.resetQty ?? 10;
        item.total_quantity = item.metadata.resetQty ?? 10;
        await this.inventoryService.insertUpdatePriceLogs(
          { marketPrice: item.market_price, salePrice: item.sale_price },
          inventoryDetails,
          'refresh-price',
        );
      }
      await this.inventoryService.bulkSave(inventoryData);
    }
    this.inventoryService.freezeSocietySkuPrice(userId);
  }

  private storeNotFoundResponse() {
    return {
      store: {
        store_found: false,
        message: 'no serving stores found',
      },
    };
  }

  @Get('pos/inventory/master')
  async fetchPosMasterCatalogue(@Headers('storeId') storeId: string) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const productEntities = await this.productsService.getPosMasterCatalog();
    const storeInventory: InventoryEntity[] =
      await this.inventoryService.getPosInventoryFromStoreId(storeId);
    const inventorySkuCodeSet = new Set(
      storeInventory.map((inventory) => {
        return inventory.sku_code;
      }),
    );
    const response = await Promise.all(
      productEntities.map(
        async (productEntity) =>
          await this.buildMasterCatalogListItemResponse(
            productEntity,
            inventorySkuCodeSet,
          ),
      ),
    );
    return { data: response };
  }

  private async buildMasterCatalogListItemResponse(
    productEntity: ProductEntity,
    inventorySkuCodeSet: Set<string>,
  ) {
    const productListItemResponse = this.commonService.mapper<
      ProductEntity,
      ProductListItemResponse
    >(productEntity, new ProductListItemResponse(), false);
    if (inventorySkuCodeSet.has(productEntity.sku_code)) {
      productListItemResponse.is_mapped = true;
    }
    productListItemResponse.category_name = productEntity.category.name;
    return productListItemResponse;
  }

  @Get('pos/inventory/catalog')
  async fetchPosCatalogue(@Headers('storeId') storeId: string) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const filters: FindOptionsWhere<InventoryEntity> = {
      store_id: storeId,
      is_active: true,
    };
    const inventoryEntities =
      await this.inventoryService.getPosInventoryByFilters(filters);
    const storeData = await this.storeService.getStoreByStoreId(storeId);
    const response = await Promise.all(
      inventoryEntities.map(
        async (inventoryEntity) =>
          await this.buildInventoryListItemResponse(inventoryEntity),
      ),
    );
    return { store: storeData, data: response };
  }

  private async buildInventoryListItemResponse(
    inventoryEntity: InventoryEntity,
  ) {
    const responseItem = this.commonService.mapper<
      InventoryEntity,
      InventoryListItemResponse
    >(inventoryEntity, new InventoryListItemResponse(), false);
    const product = inventoryEntity.product;
    responseItem.name ??= product.name;
    responseItem.article_number ??= product.article_number;
    responseItem.market_price ??= product.market_price;
    responseItem.sale_price ??= product.sale_price;
    responseItem.unit_of_measurement ??= product.unit_of_measurement;
    responseItem.category_id = product.category.id;
    responseItem.category_name = product.category.name;
    if (
      product.image_url != null &&
      !product.category.name.startsWith('http')
    ) {
      responseItem.image_url =
        this.configService.get<string>('s3CloudFrontBaseUrl') +
        responseItem.image_url;
    } else {
      responseItem.image_url = product.image_url;
    }
    responseItem.classes = product.metadata.classes;
    return responseItem;
  }

  @Post('pos/inventory/master/map-catalog')
  async mapMasterSkuToStore(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Body() mapMasterToInventoryDto: MapMasterToInventoryDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    await this.inventoryService.mapUnmapMasterProducts(
      mapMasterToInventoryDto.mapProductsIds,
      storeId,
      userId,
      true,
    );
    await this.inventoryService.mapUnmapMasterProducts(
      mapMasterToInventoryDto.unmapProductsIds,
      storeId,
      userId,
      false,
    );
    return { success: true, message: 'Update Successful' };
  }

  @Post('pos/inventory/product')
  async createPosProduct(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Body() createPosProductDto: CreatePosProductDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    if (createPosProductDto.article_number != null) {
      const inventory: InventoryEntity =
        await this.inventoryService.fetchByArticleNumberAndStoreId(
          createPosProductDto.article_number,
          storeId,
        );
      if (inventory != null) {
        throw new HttpException(
          { message: 'Article Number Already Exists.' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const skuCode = 'SP' + (await this.productsService.getNewSkuCodeForPos());
    const productArticleNumber =
      await this.productsService.getNewArticleNumber();
    await this.productsService.createNewProductWithDetails(
      skuCode,
      createPosProductDto.name,
      createPosProductDto.name,
      createPosProductDto.image_url,
      createPosProductDto.market_price,
      createPosProductDto.sale_price,
      createPosProductDto.unit_of_measurement,
      productArticleNumber,
      createPosProductDto.category_id,
      'POS',
      false,
      userId,
    );
    const inventoryArticleNumber =
      createPosProductDto.article_number != null
        ? createPosProductDto.article_number
        : productArticleNumber;
    const newInventory = InventoryEntity.createNewInventoryEntry(
      storeId,
      skuCode,
      0,
      [],
      createPosProductDto.name,
      createPosProductDto.market_price,
      createPosProductDto.sale_price,
      createPosProductDto.unit_of_measurement,
      inventoryArticleNumber,
      [],
      userId,
      null,
    );
    await this.inventoryService.save(newInventory);
    return { success: true };
  }

  @Put('pos/admin/inventory/:inventory_id')
  async updatePosInventoryAdmin(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Param('inventory_id') inventoryId: string,
    @Body() updatePosInventoryDto: UpdatePosInventoryDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const inventory = await this.inventoryService.getInventoryById(inventoryId);
    await this.validateArticleNumber(
      updatePosInventoryDto.article_number,
      inventory,
      storeId,
    );
    this.validateStoreMatch(inventory, storeId);
    this.updateInventoryPropertiesAdmin(
      inventory,
      updatePosInventoryDto,
      userId,
    );
    await this.inventoryService.save(inventory);
    return { success: true };
  }

  private async validateArticleNumber(
    articleNumber: number,
    inventory: InventoryEntity,
    storeId: string,
  ) {
    if (articleNumber != null) {
      const articleInventory =
        await this.inventoryService.fetchByArticleNumberAndStoreId(
          articleNumber,
          storeId,
        );
      if (articleInventory != null && articleInventory.id !== inventory.id) {
        throw new HttpException(
          { message: 'Input Article Number Already Exists.' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private validateStoreMatch(inventory: InventoryEntity, storeId: string) {
    if (inventory.store_id !== storeId) {
      throw new HttpException(
        { message: "Inventory Store and Current Store don't match." },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private updateInventoryPropertiesAdmin(
    inventory: InventoryEntity,
    updatePosInventoryDto: UpdatePosInventoryDto,
    userId: string,
  ) {
    if (updatePosInventoryDto.name != null) {
      inventory.name = updatePosInventoryDto.name;
    }
    if (updatePosInventoryDto.unit_of_measurement != null) {
      inventory.unit_of_measurement = updatePosInventoryDto.unit_of_measurement;
    }
    if (updatePosInventoryDto.market_price != null) {
      inventory.market_price = updatePosInventoryDto.market_price;
    }
    if (updatePosInventoryDto.sale_price != null) {
      inventory.sale_price = updatePosInventoryDto.sale_price;
    }
    if (updatePosInventoryDto.article_number != null) {
      inventory.article_number = updatePosInventoryDto.article_number;
    }
    if (updatePosInventoryDto.is_price_update_allowed != null) {
      inventory.is_price_update_allowed =
        updatePosInventoryDto.is_price_update_allowed;
    }
    if (updatePosInventoryDto.is_active != null) {
      inventory.is_active = updatePosInventoryDto.is_active;
    }
    inventory.updated_by = userId;
  }

  @Post('pos/inventory/pricing/upload')
  @UseInterceptors(FileInterceptor('file'))
  async posPricingSheetUpload(
    @UploadedFile() file,
    @Headers('userId') userId,
    @Headers('storeId') storeId,
  ) {
    const posInventoryPricingUploadBean =
      await this.validatePricingSheetAndParse(
        storeId,
        file,
        PricingType.CurrentDaySellingPrice,
      );
    posInventoryPricingUploadBean.headerMapping =
      InventoryPricingUploadBean.getHeaderMapping();
    if (posInventoryPricingUploadBean.failedRows.length == 0) {
      const bulkUploadData = await this.commonService.createNewBulkUploadEntry(
        posInventoryPricingUploadBean.successRows,
        'pos-inventory-pricing',
        userId,
      );
      posInventoryPricingUploadBean.key = bulkUploadData.accessKey;
    }
    return posInventoryPricingUploadBean;
  }

  private parsePricingSheetByHeaderMapping(csvRows) {
    const inventoryPricingUploadBeans: InventoryPricingUploadBean[] = [];
    const headerMap = this.commonService.getHeaderMap(
      InventoryPricingUploadBean.getHeaderMapping(),
    );
    for (const csvRow of csvRows) {
      const processedRow = new InventoryPricingUploadBean();
      for (const key of Object.keys(csvRow)) {
        if (headerMap.has(key)) {
          processedRow[headerMap.get(key)] = csvRow[key];
        }
      }
      inventoryPricingUploadBeans.push(processedRow);
    }
    return inventoryPricingUploadBeans;
  }

  @Post('consumer/inventory/pricing/upload')
  @UseInterceptors(FileInterceptor('file'))
  async consumerPricingSheetUpload(
    @UploadedFile() file,
    @Headers('userId') userId,
    @Query('stores') stores,
    @Query('pricingType') pricingType: PricingType,
  ) {
    const storeIds = this.commonService.getArrayFromCommaSeparatedString<string>(stores);
    const consumerInventoryPricingUploadBean =
      await this.validatePricingSheetAndParse(storeIds, file, pricingType);
    consumerInventoryPricingUploadBean.headerMapping =
      InventoryPricingUploadBean.getHeaderMapping();
    if (consumerInventoryPricingUploadBean.failedRows.length == 0) {
      const bulkUploadData = await this.commonService.createNewBulkUploadEntry(
        consumerInventoryPricingUploadBean.successRows,
        'consumer-inventory-pricing',
        userId,
      );
      consumerInventoryPricingUploadBean.key = bulkUploadData.accessKey;
    }
    return consumerInventoryPricingUploadBean;
  }

  @Post('consumer/inventory/pricing/upload/save')
  async consumerPricingSheetUploadSave(
    @Headers('storeId') storeId: string,
    @Headers('userId') userId: string,
    @Query('key') key,
    @Query('cancel') cancel,
  ) {
    const bulkUploadData = await this.validateAndGetSheetDataByKey(
      key,
      'consumer-inventory-pricing',
      storeId,
    );
    if (cancel == null) {
      bulkUploadData.status = 1;
      await this.inventoryService.updateInventoryPricing(
        bulkUploadData.jsonData.data as InventoryPricingUploadBean[],
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

  // @Post('pos/inventory/pricing/upload/save')
  // async posPricingSheetUploadSave(
  //   @Headers('storeId') storeId: string,
  //   @Headers('userId') userId: string,
  //   @Query('key') key,
  //   @Query('cancel') cancel,
  // ) {
  //   const bulkUploadData = await this.validateAndGetSheetDataByKey(
  //     key,
  //     'pos-inventory-pricing',
  //     storeId,
  //   );
  //   if (cancel == null) {
  //     bulkUploadData.status = 1;
  //     await this.inventoryService.updateInventoryPricing(
  //       bulkUploadData.jsonData.data as InventoryPricingUploadBean[],
  //       storeId,
  //       userId,
  //     );
  //     await this.commonService.saveBulkUploadData(bulkUploadData);
  //   } else if (cancel == 1) {
  //     bulkUploadData.status = 0;
  //     await this.commonService.saveBulkUploadData(bulkUploadData);
  //   } else {
  //     throw new HttpException(
  //       { message: 'Invalid input for cancel' },
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   return { success: true };
  // }

  @Put('pos/inventory/:inventory_id')
  async updatePosInventory(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Param('inventory_id') inventoryId: string,
    @Body() updatePosInventoryDto: UpdatePosInventoryDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const inventory = await this.inventoryService.getInventoryById(inventoryId);
    await this.validateArticleNumber(
      updatePosInventoryDto.article_number,
      inventory,
      storeId,
    );
    this.validateStoreMatch(inventory, storeId);
    this.updateInventoryPropertiesPosUser(
      inventory,
      updatePosInventoryDto,
      userId,
    );
    await this.inventoryService.save(inventory);
    return { success: true };
  }

  private updateInventoryPropertiesPosUser(
    inventory: InventoryEntity,
    updatePosInventoryDto: UpdatePosInventoryDto,
    userId: string,
  ) {
    if (updatePosInventoryDto.name != null) {
      inventory.name = updatePosInventoryDto.name;
    }
    if (updatePosInventoryDto.unit_of_measurement != null) {
      inventory.unit_of_measurement = updatePosInventoryDto.unit_of_measurement;
    }
    if (inventory.is_price_update_allowed) {
      if (updatePosInventoryDto.market_price != null) {
        inventory.market_price = updatePosInventoryDto.market_price;
      }
      if (updatePosInventoryDto.sale_price != null) {
        inventory.sale_price = updatePosInventoryDto.sale_price;
      }
    } else {
      if (updatePosInventoryDto.sale_price != inventory.sale_price) {
        throw new HttpException(
          { message: 'User not allowed to change inventory price.' },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    if (updatePosInventoryDto.article_number != null) {
      inventory.article_number = updatePosInventoryDto.article_number;
    }
    inventory.updated_by = userId;
  }

  @Get('pos/admin/inventory/catalog')
  async fetchPosCatalogueAdmin(@Headers('storeId') storeId: string) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const filters: FindOptionsWhere<InventoryEntity> = {
      store_id: storeId,
    };
    const inventoryEntities =
      await this.inventoryService.getPosInventoryByFilters(filters);
    const storeData = await this.storeService.getStoreByStoreId(storeId);
    const response = await Promise.all(
      inventoryEntities.map(
        async (inventoryEntity) =>
          await this.buildInventoryListItemResponse(inventoryEntity),
      ),
    );
    return { store: storeData, data: response };
  }

  @Post('pos/inventory/move')
  async moveStoreInventoryPos(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Body() inventoryMovementDto: InventoryMovementDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const inventory =
      await this.inventoryService.getInventoryFromStoreIdAndSkuCodes(
        storeId,
        inventoryMovementDto.movementList.map((item) => {
          return item.skuCode;
        }),
      );
    const movementMap = new Map(
      inventoryMovementDto.movementList.map((movement) => {
        return [
          movement.skuCode,
          { skuCode: movement.skuCode, quantity: movement.quantity },
        ];
      }),
    );
    const fromType = this.getInventoryType(inventoryMovementDto.from);
    const toType = this.getInventoryType(inventoryMovementDto.to);
    if (fromType == toType) {
      throw new BadRequestException(
        'From and To Inventory cannot be the same.',
      );
    }
    const success = await this.inventoryService.moveInventoryBulk(
      fromType,
      toType,
      inventory,
      movementMap,
      userId,
    );
    return { success: success };
  }

  private getInventoryType(inventoryType: InventoryType): InventoryType {
    return InventoryType[inventoryType] as unknown as InventoryType;
  }

  @Post('pos/inventory/receive')
  async receiveStoreInventoryPos(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Body() inventoryReceptionDto: InventoryReceptionDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const inventory =
      await this.inventoryService.getInventoryFromStoreIdAndSkuCodes(
        storeId,
        inventoryReceptionDto.receivedItems.map((item) => {
          return item.skuCode;
        }),
      );
    const additionMap = new Map(
      inventoryReceptionDto.receivedItems.map((movement) => {
        return [
          movement.skuCode,
          {
            skuCode: movement.skuCode,
            quantity: movement.quantity,
            remarks: null,
          },
        ];
      }),
    );
    const toType = this.getInventoryType(inventoryReceptionDto.to);
    const success = await this.inventoryService.addInventoryBulk(
      toType,
      inventory,
      additionMap,
      'receiving',
      userId,
    );
    return { success: success };
  }

  @Post('pos/admin/inventory/:inventory_id/adjust')
  async adjustStoreInventoryPos(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
    @Param('inventory_id') inventoryId: string,
    @Body() inventoryAdjustmentDto: InventoryAdjustmentDto,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const inventory = await this.inventoryService.getInventoryById(inventoryId);
    const toType = InventoryType.HOLD;
    const success = await this.inventoryService.addInventoryBulk(
      toType,
      [inventory],
      new Map([
        [
          inventory.sku_code,
          {
            skuCode: inventory.sku_code,
            quantity: inventoryAdjustmentDto.quantity,
            remarks: inventoryAdjustmentDto.remarks,
          },
        ],
      ]),
      'adjustment',
      userId,
    );
    return { success: success };
  }

  @Get('/backoffice/inventory/grades')
  async getGrades() {
    const grades = await this.fetchGrades();
    return grades;
  }

  @Get('/inventory/v3/refresh')
  async refreshInventory(@Query('updatedAt') updatedAt: Date) {
    return await this.inventoryService.refreshInventory(updatedAt);
  }

  @Post('/backoffice/inventory/upload')
  @UseInterceptors(FileInterceptor('file'))
  async backofficeInventorySheetUpload(
    @UploadedFile() file,
    @Headers('userId') userId,
    @Query('stores') stores,
  ) {
    if (stores == null) {
      throw new BadRequestException('Stores Not found.');
    }
    const storeIds = this.commonService.getArrayFromCommaSeparatedString<string>(stores);
    if (storeIds == null || storeIds.length == 0) {
      throw new BadRequestException('Store ID Not found.');
    }
    const results = await this.commonService.readCsvData(file);
    const parsedData = this.parseInventorySheetByHeaderMapping(results.data);
    const grades = await this.fetchGrades();
    const backofficeInventoryUploadBean: ParseResult<BackofficeInventoryUploadBean> =
      await this.inventoryService.validateInventorySheetUpload(
        parsedData,
        grades,
        storeIds
      );
    backofficeInventoryUploadBean.headerMapping =
      BackofficeInventoryUploadBean.getHeaderMapping();
    if (backofficeInventoryUploadBean.failedRows.length == 0) {
      const bulkUploadData = await this.commonService.createNewBulkUploadEntry(
        backofficeInventoryUploadBean.successRows,
        'backoffice-inventory',
        userId,
      );
      backofficeInventoryUploadBean.key = bulkUploadData.accessKey;
    }
    return backofficeInventoryUploadBean;
  }

  private parseInventorySheetByHeaderMapping(csvRows) {
    const backofficeInventoryUploadBeans: BackofficeInventoryUploadBean[] = [];
    const headerMap = this.commonService.getHeaderMap(
      BackofficeInventoryUploadBean.getHeaderMapping(),
    );
    for (const csvRow of csvRows) {
      const processedRow = new BackofficeInventoryUploadBean();
      for (const key of Object.keys(csvRow)) {
        if (headerMap.has(key)) {
          if (csvRow[key] == '') {
            processedRow[headerMap.get(key)] = null;
          } else {
            processedRow[headerMap.get(key)] = csvRow[key];
          }
        }
      }
      backofficeInventoryUploadBeans.push(processedRow);
    }
    return backofficeInventoryUploadBeans;
  }

  @Post('/backoffice/inventory/upload/save')
  async backofficeInventorySheetUploadSave(
    @Headers('userId') userId: string,
    @Query('key') key,
    @Query('cancel') cancel,
  ) {
    const bulkUploadData = await this.commonService.getBulkUploadEntryByKey(
      'backoffice-inventory',
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
      await this.inventoryService.updateInventoryBackoffice(
        bulkUploadData.jsonData.data as BackofficeInventoryUploadBean[],
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

  private patchInventory(inventory: InventoryEntity, reqBody) {
    for (const key of Object.keys(reqBody)) {
      if (reqBody[key] != null) {
        inventory[key] = reqBody[key];
      }
    }
  }

  private updateInventoryMetadata(
    inventory: InventoryEntity,
    ozoneWashingCharges: number,
    cutoffTime?: string,
    resetQty?: number,
    isOzoneWashedItem?: boolean,
  ) {
    if (inventory.metadata == null) {
      inventory.metadata = new InventoryMetadataDto();
    }
    inventory.metadata.resetQty = resetQty;
    inventory.metadata.isOzoneWashedItem = isOzoneWashedItem;
    inventory.metadata.cutoffTime = cutoffTime;
    inventory.metadata.ozoneWashingCharges = ozoneWashingCharges;
  }

  private async fetchGrades() {
    const gradeStr = await this.storeParamsService.getStringParamValue(
      'GRADES',
      '',
    );
    if (gradeStr) {
      const grades = gradeStr.split(',');
      return grades;
    } else {
      return [];
    }
  }

  private async validateAndGetSheetDataByKey(
    key: any,
    uploadType: string,
    storeId: string,
  ) {
    if (storeId == null) {
      throw new BadRequestException('Store ID Not found.');
    }
    const bulkUploadData = await this.commonService.getBulkUploadEntryByKey(
      uploadType,
      key,
    );
    if (bulkUploadData == null) {
      throw new HttpException(
        { message: 'No Bulk Upload data found for given key and module.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return bulkUploadData;
  }

  private async validatePricingSheetAndParse(
    storeIds: string[],
    file: any,
    pricingType: PricingType,
  ) {
    if (storeIds == null || storeIds.length == 0) {
      throw new BadRequestException('stores Not found.');
    }
    const results = await this.commonService.readCsvData(file);
    const parsedData = this.parsePricingSheetByHeaderMapping(results.data);
    const consumerInventoryPricingUploadBean: ParseResult<InventoryPricingUploadBean> =
      await this.inventoryService.validatePricingSheetUpload(
        parsedData,
        storeIds,
        pricingType,
      );
    return consumerInventoryPricingUploadBean;
  }

  @Post('/backoffice/audience/upload')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUploadAudienceSku(
    @UploadedFile() file,
    @Headers('userId') userId,
    @Query('validDeliveryDate') validDeliveryDate,
    @Query('audienceId') audienceId,
  ) {
    if (validDeliveryDate == null) {
      throw new HttpException(
        { message: 'Valid Delivery Date is required' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const results = await this.commonService.readCsvData(file);
    const parsedData = this.parseAudienceSheetByHeaderMapping(results.data);
    const audienceSkuUploadBeanParseResult: ParseResult<AudienceSkuUploadBean> =
      await this.inventoryService.validateAudienceSkuSheetUpload(
        parsedData,
        validDeliveryDate,
        audienceId,
      );
    audienceSkuUploadBeanParseResult.headerMapping =
      AudienceSkuUploadBean.getHeaderMapping();
    if (audienceSkuUploadBeanParseResult.failedRows.length == 0) {
      const bulkUploadData = await this.commonService.createNewBulkUploadEntry(
        audienceSkuUploadBeanParseResult.successRows,
        'backoffice-audience',
        userId,
      );
      audienceSkuUploadBeanParseResult.key = bulkUploadData.accessKey;
    }
    return audienceSkuUploadBeanParseResult;
  }

  private parseAudienceSheetByHeaderMapping(csvRows) {
    const audienceSkuUploadBeans: AudienceSkuUploadBean[] = [];
    const headerMap = this.commonService.getHeaderMap(
      AudienceSkuUploadBean.getHeaderMapping(),
    );
    for (const csvRow of csvRows) {
      const processedRow = new AudienceSkuUploadBean();
      for (const key of Object.keys(csvRow)) {
        if (headerMap.has(key)) {
          if (csvRow[key] == '') {
            processedRow[headerMap.get(key)] = null;
          } else {
            processedRow[headerMap.get(key)] = csvRow[key];
          }
        }
      }
      audienceSkuUploadBeans.push(processedRow);
    }
    return audienceSkuUploadBeans;
  }

  @Post('/backoffice/audience/upload/save')
  async bulkUploadAudienceSkuSave(
    @Headers('userId') userId: string,
    @Query('key') key,
    @Query('cancel') cancel,
  ) {
    const bulkUploadData = await this.validateAndGetSheetDataByKey(
      key,
      'backoffice-audience',
      'default',
    );
    if (cancel == null) {
      bulkUploadData.status = 1;
      await this.inventoryService.updateAudienceSkuDiscounts(
        bulkUploadData.jsonData.data as AudienceSkuUploadBean[],
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
}
