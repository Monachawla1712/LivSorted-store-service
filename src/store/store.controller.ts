import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { NewStoreDto } from './dto/newStore.dto';
import { UpdateStoreDto } from './dto/updateStore.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { CordinatesDto, StoresNearMeDto } from './dto/selectStores.dto';
import { StoreEntity, StoreMetadata } from './entity/store.entity';
import { StoreStatus } from './enum/store.status';
import { EasebuzzVirtualAccountResponseDto } from './dto/easebuzz-virtual-account-response.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SkuBean, StoreSkuResponseDto } from './dto/storeSkuResponse.dto';
import { InventoryView } from './enum/inventory-view.enum';
import { InventoryViewRequestStatus } from './enum/inventory-view-request-status.enum';
import { CommonService } from '../common/common.service';
import { RegisterStoreDto } from './dto/register-store.dto';
import { ApproveViewInventoryRequestDto } from './dto/approve-view-inventory-request.dto';
import { ApproveStoreDto } from './dto/approve-store.dto';
import { CreateNewStoreFosDto } from './dto/create-new-store-fos.dto';
import { UpdateStoreFosDto } from './dto/update-store-fos.dto';
import { InventoryViewRequestService } from './inventory-view-request.service';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { ProductEntity } from '../products/entity/products.entity';
import { ProductsService } from '../products/products.service';
import {
  GeoJSONFeatureCollection,
  GeoJSONGeometry,
} from './dto/GeoJson.interface';
import { VerifyStoreBackofficeDto } from './dto/verify-store-backoffice.dto';
import { NearbyStoresDto } from './dto/nearby-stores.dto';
import { NearbyStoreListItemResponseDto } from './dto/nearby-store-list-item-response.dto';
import { StoreParamsService } from '../store-params/store-params.service';
import { StoreOrderDetails } from './dto/store-order-details.dto';
import { WalletListItemResponse } from './dto/wallet-list-item-response.class';
import { v4 as uuidv4 } from 'uuid';

@Controller()
@ApiTags('Stores')
@UseFilters(HttpExceptionFilter)
export class StoreController {
  private readonly logger = new CustomLogger(StoreController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private storeService: StoreService,
    private commonService: CommonService,
    private inventoryViewRequestService: InventoryViewRequestService,
    private productsService: ProductsService,
    private storeParamsService: StoreParamsService,
  ) {}

  @Get('store')
  getStores(@Query() filters, @Headers('userId') userId: string) {
    return this.storeService.getStores(filters, userId);
  }

  // todo: deprecated API, not in use
  @ApiBody({ type: NewStoreDto })
  @Post('store')
  createStore(
    @Body() newStore: NewStoreDto,
    @Headers('userId') createdBy: string,
  ) {
    if (newStore.location) {
      newStore.location = newStore.location.features[0].geometry;
    }
    if (newStore.boundry) {
      newStore.boundry = newStore.boundry.features[0].geometry;
    }
    if (!newStore.store_type) {
      newStore.store_type = newStore.store_type || 'FRANCHISE';
    }
    return this.storeService.createStore(newStore, createdBy);
  }

  @Get('store/warehouse-list')
  getWarehouseList(): Promise<any> {
    return this.storeService.getWarehouseList();
  }

  @ApiBody({ type: CordinatesDto })
  @Post('store/near')
  nearestStore(
    @Body() cordinates: CordinatesDto,
    @Headers('userId') userId: string,
  ) {
    return this.storeService.getNearestStore(
      cordinates.lat,
      cordinates.long,
      userId,
    );
  }

  @ApiBody({ type: StoresNearMeDto })
  @Post('store/nearme')
  nearestStores(@Body() cordinates: StoresNearMeDto) {
    return this.storeService.getNearestStores(
      cordinates.lat,
      cordinates.long,
      cordinates.range || 40,
    );
  }

  @ApiBody({ type: UpdateStoreDto })
  @Patch('store/:storeId')
  async updateStore(
    @Body() updateStoreDto: UpdateStoreDto,
    @Headers('userId') userId,
    @Param('storeId') storeId: string,
  ) {
    const existingStore: StoreEntity =
      await this.storeService.getStoreFromStoreIdIgnoreActive(storeId);
    if (!existingStore) {
      throw new HttpException(
        { message: 'Store not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (updateStoreDto.open_time != updateStoreDto.deliveryOpenTime) {
      throw new HttpException(
        {
          message: 'Open time and delivery open time must be the same',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    updateStoreDto.location = this.fetchLocation(updateStoreDto.location);
    const updatedStore = new StoreEntity();
    Object.assign(updatedStore, existingStore);
    updatedStore.updatedBy = userId;
    Object.assign(updatedStore, updateStoreDto);
    const openTime: string = updateStoreDto.open_time
      ? updateStoreDto.open_time
      : existingStore.open_time;
    updatedStore.open_time = openTime;
    updatedStore.deliveryOpenTime = openTime;
    this.patchStoreMetadataFromUpdateRequest(updatedStore, updateStoreDto);
    return await this.storeService.updateStore(existingStore, updatedStore);
  }

  private patchStoreMetadataFromUpdateRequest(
    updatedStore: StoreEntity,
    updateStoreDto: UpdateStoreDto,
  ) {
    if (updatedStore.metadata == null) {
      updatedStore.metadata = new StoreMetadata();
    }
    if (updateStoreDto.gstNumber != null) {
      updatedStore.metadata.gstNumber = updateStoreDto.gstNumber;
    }
    if (updateStoreDto.panNumber != null) {
      updatedStore.metadata.panNumber = updateStoreDto.panNumber;
    }
  }

  @ApiBody({ type: CordinatesDto })
  @Post('store/serving-stores')
  @HttpCode(HttpStatus.OK)
  getServingStores(@Body() coordinates: CordinatesDto) {
    return this.storeService.getServingStores(coordinates);
  }

  @Get('store/categories')
  async getStoreCategories(): Promise<any> {
    return await this.storeService.getCategories();
  }

  @Post('store/easebuzz/virtual-account')
  async syncStoreEasebuzzVirtualAccount(@Headers('storeId') storeId: string) {
    let storeEntity: StoreEntity = await this.storeService.getStoreFromStoreId(
      storeId,
    );

    if (storeEntity == null)
      throw new HttpException(
        { message: 'Store not found' },
        HttpStatus.NOT_FOUND,
      );

    if (
      !(
        storeEntity.status == StoreStatus.APPROVED ||
        storeEntity.status == StoreStatus.VERIFIED ||
        storeEntity.status == StoreStatus.INFO_VERIFIED
      )
    )
      throw new HttpException(
        {
          message:
            'Store not found in approved or verified status. Current status : ' +
            storeEntity.status,
        },
        HttpStatus.BAD_REQUEST,
      );

    await this.storeService.addEasebuzzVirtualAccountIfEligible(storeEntity);
    if (
      storeEntity.easebuzzVirtualAccountId == null ||
      storeEntity.easebuzzQrCode == null
    ) {
      throw new HttpException(
        {
          message:
            'Something went wrong while creating easebuzz virtual account',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    storeEntity = await this.storeService.save(storeEntity);
    return storeEntity;
  }

  @Get('store/easebuzz/virtual-account')
  async getStoreEasebuzzVirtualAccountQrCode(
    @Headers('storeId') storeId: string,
  ) {
    const store = await this.storeService.getStoreFromStoreId(storeId);
    if (store != null && store.easebuzzQrCode != null) {
      const response = new EasebuzzVirtualAccountResponseDto();
      response.storeId = storeId;
      response.storeName = store.name;
      response.easebuzzQrCode = store.easebuzzQrCode;
      return response;
    } else {
      throw new HttpException(
        {
          message:
            'QR code does not exist for this store. Please contact support',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('store/upload/images')
  @UseInterceptors(FilesInterceptor('images', 20))
  async uploadImages(@UploadedFiles() images: Array<Express.Multer.File>) {
    const imageUrlArray = [];
    for (const image of images) {
      const imageUrl = await this.commonService.uploadFile(
        image,
        'store',
        'store-image-' + uuidv4() + '-' + image.originalname,
      );
      imageUrlArray.push(imageUrl);
    }
    return { imagesUrl: imageUrlArray };
  }

  @Get('franchise-store')
  async getMasterSkus(
    @Headers('storeId') storeId: string,
    @Headers('roles') roles: string[],
    @Query() query: { isBackOfficeRequest: number },
  ): Promise<StoreSkuResponseDto> {
    const storeInfo = await this.storeService.getStoreByStoreId(storeId);
    let response = new StoreSkuResponseDto();
    response.storeId = parseInt(storeId);
    response.isSrpStore = 0;
    response.skuBeans = [];
    let viewRequestedFlag = 0;
    const inventoryViewRequestsList =
      await this.inventoryViewRequestService.getInventoryViewRequests(
        storeId,
        [InventoryViewRequestStatus.PENDING],
        1,
        1,
      );
    if (inventoryViewRequestsList.data.length > 0) {
      viewRequestedFlag = 1;
    }
    if (
      storeInfo == null ||
      storeInfo.isActive != true ||
      !(
        storeInfo.status == StoreStatus.INFO_VERIFIED ||
        storeInfo.status == StoreStatus.VERIFIED
      )
    ) {
      response.inventoryView = InventoryView[InventoryView.FULL_VIEW];
      response.isRequested = viewRequestedFlag;
      return response;
    }
    let viewFlag = InventoryView[storeInfo.inventoryView];
    if (
      this.includesAnyFromSet(
        roles,
        new Set(['FOSUSER', 'ACCOUNTMANAGEMENT', 'ADMIN']),
      )
    ) {
      viewFlag = InventoryView[InventoryView.FULL_VIEW];
    }

    if (
      query != null &&
      query.isBackOfficeRequest != null &&
      query.isBackOfficeRequest == 1
    ) {
      storeId = storeId + '?isBackOfficeRequest=1';
    }
    try {
      response = (await this.storeService.getSkus(
        storeId,
      )) as StoreSkuResponseDto;
      const skuCodes: string[] = response.skuBeans.map(
        (skuBean: SkuBean) => skuBean.skuCode,
      );
      const productMap: Map<string, ProductEntity> = await this.getProductsMap(
        skuCodes,
      );
      this.mergeProductsInfo(response, productMap);
      this.sortFranchiseInventoryByName(response.skuBeans);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching skus',
        e,
      );
    }
    response.inventoryView = viewFlag;
    response.isRequested = viewRequestedFlag;
    return response;
  }

  mergeProductsInfo(
    response: StoreSkuResponseDto,
    productMap: Map<string, ProductEntity>,
  ) {
    for (const skuBean of response.skuBeans) {
      if (productMap.has(skuBean.skuCode)) {
        const product = productMap.get(skuBean.skuCode);
        skuBean.classes = product.metadata.classes;
        skuBean.partnerContents = product.metadata.partnerContents;
        skuBean.videos = product.videos;
      }
    }
  }

  private includesAnyFromSet(roles: string[], rolesSet: Set<string>) {
    for (const role of roles) {
      if (rolesSet.has(role)) {
        return true;
      }
    }
    return false;
  }

  @Get('franchise-stores')
  getFranchiseStore(): Promise<any> {
    return this.storeService.getFranchiseStores();
  }

  @Post('franchise/store/register')
  async registerStore(
    @Headers('userId') userId: string,
    @Body() registerStoreDto: RegisterStoreDto,
  ) {
    const stores: StoreEntity[] = await this.storeService.getStoresByOwnerId(
      userId,
    );
    this.storeAlreadyRegisteredCheck(stores);
    await this.updateUserData(userId, registerStoreDto.ownerName);
    const userInfo = await this.getUserInfo(userId);
    const store = StoreEntity.createNewStore(
      userId,
      registerStoreDto.ownerName,
      registerStoreDto.name,
      registerStoreDto.addressLine_1,
      registerStoreDto.addressLine_2,
      registerStoreDto.landmark,
      registerStoreDto.city,
      registerStoreDto.state,
      registerStoreDto.pincode,
      userInfo != null ? userInfo['phone_number'] : null,
      null,
      registerStoreDto.pocName,
      registerStoreDto.pocContactNo,
      registerStoreDto.open_time,
      registerStoreDto.close_time,
      'FRANCHISE',
      StoreStatus.UNVERIFIED,
      'CATEGORY-C',
      [],
      [],
      null,
      'Unattended',
      null,
      null,
      userId,
    );
    await this.storeService.createNewStore(store, false);
    return {
      success: true,
      message: 'verification request sent successfully',
    };
  }

  @Post('franchise/inventory-request')
  async raiseInventoryRequest(
    @Headers('userId') userId: string,
    @Headers('storeId') storeId: string,
  ) {
    const inventoryViewRequestsList =
      await this.inventoryViewRequestService.getInventoryViewRequests(
        storeId,
        [InventoryViewRequestStatus.PENDING],
        1,
        1,
      );
    if (inventoryViewRequestsList.data.length > 0) {
      throw new HttpException(
        {
          message: 'Request already raised.',
        },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      await this.inventoryViewRequestService.createInventotyViewRequest(
        storeId,
        userId,
      );
    }
    return { success: true, message: 'Request raised successfully.' };
  }

  @Get('backoffice/inventory-request/pending')
  async viewPendingInventoryRequests(
    @Headers('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 500,
  ) {
    const inventoryViewRequests =
      await this.inventoryViewRequestService.getInventoryViewRequests(
        null,
        [InventoryViewRequestStatus.PENDING],
        page,
        limit,
      );
    const stores = await this.storeService.getStoresByStoreIds(
      inventoryViewRequests.data.map((request) => {
        return request.storeId;
      }),
    );
    const storesMap = new Map<string, StoreEntity>();
    stores.forEach((store) => {
      storesMap.set(store.store_id, store);
    });
    inventoryViewRequests.data.forEach((request) => {
      request.store = this.commonService.cleanObject(
        storesMap.get(request.storeId),
        new Set(['name', 'contactNumber']),
      );
    });
    return inventoryViewRequests;
  }

  @Post('backoffice/inventory-request/approve')
  async confirmPendingInventoryRequests(
    @Headers('userId') userId: string,
    @Body() approveViewInventoryRequestDto: ApproveViewInventoryRequestDto,
  ) {
    const inventoryViewRequests =
      await this.inventoryViewRequestService.getPendingInventoryViewRequestsByIds(
        approveViewInventoryRequestDto.ids,
      );
    if (inventoryViewRequests == null || inventoryViewRequests.length === 0) {
      throw new HttpException(
        {
          message: 'No requests found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    const storeIds = inventoryViewRequests.map((inventoryViewRequest) => {
      inventoryViewRequest.status = approveViewInventoryRequestDto.status;
      inventoryViewRequest.approvedBy = userId;
      return inventoryViewRequest.storeId;
    });
    if (
      approveViewInventoryRequestDto.status ==
      InventoryViewRequestStatus.APPROVED
    ) {
      const stores = await this.storeService.getStoresByStoreIds(storeIds);
      for (const store of stores) {
        store.inventoryView =
          approveViewInventoryRequestDto.inventoryViewStatus;
        store.updatedBy = userId;
      }
      await this.storeService.save(stores);
    }
    await this.inventoryViewRequestService.bulkSaveInventoryViewRequest(
      inventoryViewRequests,
    );
    return {
      success: true,
      message: 'Request approval completed successfully.',
    };
  }

  @Get('fos/unverified-stores')
  getUnverifiedStores(
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
    @Query('search') search,
  ) {
    return this.storeService.getUnverifiedFranchiseStores(page, limit, search);
  }

  @Get('fos/user/:id/unverified-stores')
  getUnverifiedFranchiseStoresFromOwnerId(
    @Param('id') ownerId: string,
  ): Promise<StoreEntity[]> {
    return this.storeService.getUnverifiedFranchiseStoresFromOwnerId(ownerId);
  }

  @Put('fos/approve/:id')
  async FosStoreApprovalByStoreId(
    @Headers('userId') userId: string,
    @Param('id') id: string,
    @Body() approveStoreDto: ApproveStoreDto,
  ): Promise<StoreEntity> {
    const store: StoreEntity =
      await this.storeService.getFranchiseStoreByStoreId(id);
    return this.approveStoreFos(store, userId, approveStoreDto);
  }

  @Put('fos/approve/v2/:id')
  async FosStoreApprovalById(
    @Headers('userId') userId: string,
    @Param('id') id: string,
    @Body() approveStoreDto: ApproveStoreDto,
  ): Promise<StoreEntity> {
    const store: StoreEntity = await this.storeService.getFranchiseStoreById(
      id,
    );
    return this.approveStoreFos(store, userId, approveStoreDto);
  }

  @Put('store/backoffice/approve/:id')
  async backofficeApproveStore(
    @Headers('userId') userId: string,
    @Param('id') id: string,
    @Body() verifyStoreBackofficeDto: VerifyStoreBackofficeDto,
  ): Promise<StoreEntity> {
    const store: StoreEntity = await this.storeService.getFranchiseStoreById(
      id,
    );
    if (store == null) {
      throw new HttpException(
        { message: 'Store not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (store.status != StoreStatus.APPROVED) {
      throw new HttpException(
        { message: 'Only stores in Approved status can be verified.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      verifyStoreBackofficeDto.verificationStatus ==
      StoreStatus.VERIFICATION_FAILED
    ) {
      store.metadata.remarks = verifyStoreBackofficeDto.remarks;
      if (verifyStoreBackofficeDto.duplicateStoreId != null) {
        const duplicateStore: StoreEntity =
          await this.storeService.getStoreFromStoreIdIgnoreActive(
            verifyStoreBackofficeDto.duplicateStoreId,
          );
        if (duplicateStore == null) {
          throw new HttpException(
            { message: 'Duplicate Store not found.' },
            HttpStatus.NOT_FOUND,
          );
        }
      }
    } else if (
      verifyStoreBackofficeDto.verificationStatus == StoreStatus.INFO_VERIFIED
    ) {
      if (verifyStoreBackofficeDto.duplicateStoreId != null) {
        throw new HttpException(
          { message: 'A verified store cannot have a duplicate' },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      throw new HttpException(
        { message: 'Store cannot be moved to this status.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    store.status = verifyStoreBackofficeDto.verificationStatus;
    store.duplicateId = verifyStoreBackofficeDto.duplicateStoreId;
    store.updatedBy = userId;
    const mappingList = [];
    if (
      verifyStoreBackofficeDto.verificationStatus == StoreStatus.INFO_VERIFIED
    ) {
      mappingList.push(store.ownerId);
      await this.storeService.createAmStoreMapping(
        store.approvedBy,
        store.store_id,
      );
    }
    return await this.storeService.updateExistingStore(
      store,
      false,
      mappingList,
    );
  }

  @Post('fos/store')
  async createStoreFos(
    @Headers('userId') userId: string,
    @Headers('appId') appId: string,
    @Headers('appVersion') appVersion: string,
    @Body() createNewStoreFosDto: CreateNewStoreFosDto,
  ) {
    this.checkAppId(appId);
    if (createNewStoreFosDto.open_time != null) {
      createNewStoreFosDto.deliveryOpenTime = createNewStoreFosDto.open_time;
    }
    const userInfo = await this.storeService.getUserByPhone(
      createNewStoreFosDto.contactNumber,
    );
    const stores: StoreEntity[] = await this.storeService.getStoresByOwnerId(
      userInfo['id'],
    );
    this.storeAlreadyRegisteredCheck(stores);
    await this.updateUserData(userInfo['id'], createNewStoreFosDto.ownerName);
    const store = StoreEntity.createNewStore(
      userInfo['id'],
      createNewStoreFosDto.ownerName,
      createNewStoreFosDto.name,
      createNewStoreFosDto.addressLine_1,
      createNewStoreFosDto.addressLine_2,
      createNewStoreFosDto.landmark,
      createNewStoreFosDto.city,
      createNewStoreFosDto.state,
      createNewStoreFosDto.pincode,
      userInfo != null ? userInfo['phone_number'] : null,
      this.fetchLocation(createNewStoreFosDto.location),
      createNewStoreFosDto.pocName,
      createNewStoreFosDto.pocContactNo,
      createNewStoreFosDto.open_time,
      null,
      'FRANCHISE',
      StoreStatus.APPROVED,
      'CATEGORY-C',
      createNewStoreFosDto.storeImages,
      createNewStoreFosDto.storeVideos,
      createNewStoreFosDto.storeLocationType,
      createNewStoreFosDto.storeDeliveryType,
      createNewStoreFosDto.storeSubtype,
      createNewStoreFosDto.salesPotential,
      userId,
    );
    store.approvedBy = userId;
    store.metadata.locationCaptureAccuracy =
      createNewStoreFosDto.fetchLocationAccuracy;
    const createdStore = await this.storeService.createNewStore(
      store,
      true,
      true,
      userId,
    );
    const amUserInfo = await this.getUserInfo(userId);
    if (amUserInfo != null) {
      store.metadata.approverName = amUserInfo['name'];
    }
    if (createdStore.status == StoreStatus.APPROVED) {
      await this.storeService.createAmStoreMapping(
        userId,
        createdStore.store_id,
      );
    }
    return {
      success: true,
      message: 'store created successfully',
      store: createdStore,
    };
  }

  @Patch('fos/store/:store_id')
  async updateStoreFos(
    @Headers('appId') appId: string,
    @Headers('userId') userId: string,
    @Param('store_id') storeId: string,
    @Body() updateStoreFosDto: UpdateStoreFosDto,
  ) {
    this.checkAppId(appId);
    let store = await this.storeService.getStoreFromStoreId(storeId);
    if (store == null) {
      throw new HttpException(
        { message: 'Store not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (updateStoreFosDto.open_time != null) {
      updateStoreFosDto.deliveryOpenTime = updateStoreFosDto.open_time;
    }
    if (updateStoreFosDto.location != null) {
      updateStoreFosDto.location = this.fetchLocation(
        updateStoreFosDto.location,
      );
      if (!this.isSameLocation(updateStoreFosDto.location, store.location)) {
        store.status = StoreStatus.APPROVED;
      }
    }
    this.patchStore(store, updateStoreFosDto);
    store.updatedBy = userId;
    if (store.metadata == null) {
      store.metadata = new StoreMetadata();
    }
    store.metadata.locationCaptureAccuracy =
      updateStoreFosDto.fetchLocationAccuracy;
    store = await this.storeService.updateExistingStore(store, true);
    return {
      success: true,
      message: 'store updated',
      store: store,
    };
  }

  private patchStore(store: StoreEntity, updateStoreFosDto: UpdateStoreFosDto) {
    for (const key of Object.keys(updateStoreFosDto)) {
      if (updateStoreFosDto[key] != null) {
        store[key] = updateStoreFosDto[key];
      }
    }
  }

  private fetchLocation(
    location: GeoJSONFeatureCollection | GeoJSONGeometry,
  ): GeoJSONGeometry {
    try {
      if ('features' in location) {
        const loc = location.features[0].geometry;
        if (loc.coordinates[0] < loc.coordinates[1]) {
          [loc.coordinates[0], loc.coordinates[1]] = [
            loc.coordinates[1],
            loc.coordinates[0],
          ];
        }
        return loc;
      }
    } catch (e) {
      return <GeoJSONGeometry>location;
    }
  }

  private sortFranchiseInventoryByName(skuBeans: SkuBean[]) {
    skuBeans.sort((item1, item2) => {
      const nameA = item1.name.toUpperCase();
      const nameB = item2.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }

  private storeAlreadyRegisteredCheck(stores: StoreEntity[]) {
    if (stores != null && stores.length > 0) {
      throw new HttpException(
        {
          message: 'Store already registered with this number.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async updateUserData(userId: string, ownerName: string) {
    try {
      await this.storeService.updateUserInternal(userId, ownerName);
    } catch (e) {
      //Do Nothing
    }
  }

  private async getUserInfo(userId: string) {
    let userInfo = null;
    try {
      userInfo = await this.storeService.getUserInternal(userId);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching user info',
        e,
      );
    }
    return userInfo;
  }

  private checkAppId(appId: string) {
    if (appId == null) {
      throw new HttpException(
        {
          message:
            'This feature is disabled for old versions. Please Update to the latest version.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('franchise/nearby-stores')
  async fetchNearbyStoresList(
    @Headers('userId') userId: string,
    @Body() nearbyStoresDto: NearbyStoresDto,
  ) {
    let latitude: string = nearbyStoresDto.lat;
    let longitude: string = nearbyStoresDto.long;
    if (nearbyStoresDto.storeId != null) {
      const store = await this.storeService.getStoreByStoreId(
        nearbyStoresDto.storeId,
      );
      longitude = String(store.location.coordinates[0]);
      latitude = String(store.location.coordinates[1]);
    }
    if (latitude == null || longitude == null) {
      throw new HttpException(
        {
          message: 'Latitude or Longitude missing.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const nearbyDistance = await this.storeParamsService.getNumberParamValue(
      'NEARBY_STORE_SEARCH_RADIUS',
      100,
    );
    const nearbyStores: { store_id: string; distance: number }[] =
      await this.storeService.getNearbyStoreIdsFromLocation(
        nearbyStoresDto.storeId,
        latitude,
        longitude,
        nearbyDistance,
      );
    const nearbyStoreIds = nearbyStores.map((store) => {
      return store.store_id;
    });
    const stores: StoreEntity[] = await this.storeService.getStoresByStoreIds(
      nearbyStoreIds,
    );
    if (stores.length == 0) {
      return { stores: [] };
    }
    const storeDetailsMap = await this.getStoreDetailsMap(nearbyStores);
    const storeOrderDetailsMap = await this.getStoreOrderDetailsMap(
      nearbyStoreIds,
    );
    const storeWalletDetailsMap = await this.getStoreWalletDetailsMap(
      nearbyStoreIds,
    );
    const storesResponse = this.buildNearbyStoresListResponse(
      stores,
      storeOrderDetailsMap,
      storeWalletDetailsMap,
      storeDetailsMap,
    );
    return { stores: storesResponse };
  }

  private async getStoreOrderDetailsMap(nearbyStoreIds: string[]) {
    const storeOrderDetails: StoreOrderDetails[] =
      await this.storeService.getStoreOrderDetails(nearbyStoreIds);
    const storeOrderDetailsMap = new Map<string, StoreOrderDetails>();
    if (
      nearbyStoreIds != null &&
      nearbyStoreIds.length > 0 &&
      storeOrderDetails != null &&
      storeOrderDetails.length > 0
    ) {
      for (const storeOrderDetail of storeOrderDetails) {
        storeOrderDetailsMap.set(storeOrderDetail.storeId, storeOrderDetail);
      }
    }
    return storeOrderDetailsMap;
  }

  private buildNearbyStoresListResponse(
    stores: StoreEntity[],
    storeOrderDetailsMap: Map<string, StoreOrderDetails>,
    storeWalletDetailsMap: Map<string, WalletListItemResponse>,
    storeDetailsMap: Map<string, { store_id: string; distance: number }>,
  ) {
    const storesResponse = [];
    for (const store of stores) {
      const respListItem: NearbyStoreListItemResponseDto =
        this.commonService.mapper(
          store,
          new NearbyStoreListItemResponseDto(),
          false,
        );
      if (
        storeOrderDetailsMap != null &&
        storeOrderDetailsMap.has(store.store_id)
      ) {
        respListItem.lastOrderDate = storeOrderDetailsMap
          .get(store.store_id)
          .lastOrderDate.slice(0, 10);
        respListItem.lifetimeOrderCount = Number(
          storeOrderDetailsMap.get(store.store_id).count,
        );
      }
      if (
        storeWalletDetailsMap != null &&
        storeWalletDetailsMap.has(store.store_id)
      ) {
        respListItem.walletAmount = Number(
          storeWalletDetailsMap.get(store.store_id).amount,
        );
      }
      if (storeDetailsMap != null && storeDetailsMap.has(store.store_id)) {
        respListItem.distance = Number(
          storeDetailsMap.get(store.store_id).distance,
        );
      }
      storesResponse.push(respListItem);
    }
    return storesResponse;
  }

  private async getStoreWalletDetailsMap(storeIds: string[]) {
    const storeWalletDetails =
      await this.storeService.fetchStoreWalletsInternal(storeIds);
    const storeOrderDetailsMap = new Map<string, WalletListItemResponse>();
    if (
      storeIds != null &&
      storeIds.length > 0 &&
      storeWalletDetails != null &&
      storeWalletDetails.length > 0
    ) {
      for (const storeWalletDetail of storeWalletDetails) {
        storeOrderDetailsMap.set(storeWalletDetail.entityId, storeWalletDetail);
      }
    }
    return storeOrderDetailsMap;
  }

  @Post('franchise/store/:store_id/start-journey')
  async startStoreJourney(
    @Headers('userId') userId: string,
    @Param('store_id') storeId: string,
  ) {
    const store = await this.storeService.getStoreFromStoreId(storeId);
    if (store.metadata.journeyStartTime != null) {
      return { success: true, message: 'journey already started' };
    }
    store.metadata.journeyStartTime = this.commonService.convertUtcToIst(
      new Date(),
    );
    store.updatedBy = userId;
    await this.storeService.save(store);
    return { success: true, message: 'journey started' };
  }

  private async getStoreDetailsMap(
    nearbyStores: { store_id: string; distance: number }[],
  ) {
    const storeDetailsMap = new Map<
      string,
      { store_id: string; distance: number }
    >();
    if (nearbyStores != null) {
      for (const storeDetails of nearbyStores) {
        storeDetailsMap.set(storeDetails.store_id, storeDetails);
      }
    }
    return storeDetailsMap;
  }

  private async getProductsMap(skuCodes: string[]) {
    const products = await this.productsService.getAllProduct({
      sku_code: skuCodes.join(','),
    });
    return new Map<string, ProductEntity>(
      products.map((product) => {
        return [product.sku_code, product];
      }),
    );
  }

  private async approveStoreFos(
    store: StoreEntity,
    userId: string,
    approveStoreDto: ApproveStoreDto,
  ) {
    if (store == null) {
      throw new HttpException(
        { message: 'Store not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      store.status == StoreStatus.APPROVED ||
      store.status == StoreStatus.INFO_VERIFIED ||
      store.status == StoreStatus.VERIFIED
    ) {
      throw new HttpException(
        { message: 'Store already in approved/verified status.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (store.verificationRetryCount >= 1) {
      throw new HttpException(
        { message: 'verification can only be retried once.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      approveStoreDto.verificationStatus == StoreStatus.APPROVED &&
      approveStoreDto.open_time == null
    ) {
      throw new HttpException(
        { message: 'open time is mandatory for approval.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (approveStoreDto.location != null) {
      approveStoreDto.location = this.fetchLocation(approveStoreDto.location);
    }
    if (approveStoreDto.open_time != null) {
      approveStoreDto.deliveryOpenTime = approveStoreDto.open_time;
    }
    if (store.duplicateId != null) {
      store.verificationRetryCount += 1;
    }
    Object.assign(store, approveStoreDto);
    store.status = approveStoreDto.verificationStatus;
    store.updatedBy = userId;
    store.approvedBy = userId;
    const userInfo = await this.getUserInfo(userId);
    if (userInfo != null) {
      store.metadata.approverName = userInfo['name'];
    }
    if (approveStoreDto.verificationStatus == StoreStatus.REJECTED) {
      await this.storeService.saveFranchiseStore(store);
      return store;
    }
    return await this.storeService.updateExistingStore(store, true, [userId]);
  }

  private isSameLocation(
    location1: GeoJSONGeometry,
    location2: GeoJSONGeometry,
  ) {
    return (
      location1 != null &&
      location2 != null &&
      location1.coordinates != null &&
      location2.coordinates != null &&
      location1.coordinates[0] == location2.coordinates[0] &&
      location1.coordinates[1] == location2.coordinates[1]
    );
  }

  @Post('store/easebuzz/virtual-account/cron')
  async syncStoresEasebuzzVirtualAccountCron() {
    try {
      const storesWithoutQr: StoreEntity[] = await this.storeService.getStores(
        {
          status: [
            StoreStatus.APPROVED,
            StoreStatus.VERIFIED,
            StoreStatus.INFO_VERIFIED,
          ].join(','),
          hasEasebuzzVA: false,
          is_active: 1,
        },
        null,
      );
      const count = storesWithoutQr ? storesWithoutQr.length : 0;
      this.logger.log(
        this.asyncContext.get('traceId'),
        `Creating easebuzz virtual account for ${count} stores`,
      );
      if (count > 0) {
        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < storesWithoutQr.length; i += batchSize) {
          batches.push(storesWithoutQr.slice(i, i + batchSize));
        }
        // Process batches sequentially
        for (const batch of batches) {
          // Process stores in a batch parallelly
          await Promise.all(
            batch.map(async (storeEntity) => {
              try {
                await this.storeService.addEasebuzzVirtualAccountIfEligible(
                  storeEntity,
                );
                if (
                  storeEntity.easebuzzVirtualAccountId == null ||
                  storeEntity.easebuzzQrCode == null
                ) {
                  this.logger.error(
                    this.asyncContext.get('traceId'),
                    'Virtual account details not found while creating easebuzz Qr for store id : ' +
                      storeEntity.store_id,
                    null,
                  );
                } else {
                  await this.storeService.save(storeEntity);
                }
              } catch (e) {
                this.logger.error(
                  this.asyncContext.get('traceId'),
                  'Error while creating easebuzz virtual account for store id : ' +
                    storeEntity.store_id,
                  e,
                );
              }
            }),
          );
        }
      }
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Error while processing cron for syncing easebuzz virtual accounts',
        e,
      );
    }
  }
}
