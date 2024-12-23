import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/configuration';
import { NewStoreDto } from './dto/newStore.dto';
import { StoreEntity } from './entity/store.entity';
import {
  DataSource,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ZoneService } from '../zones/zone.service';
import { CordinatesDto } from './dto/selectStores.dto';
import * as moment from 'moment';
import { StoreResponse } from './dto/store-response.dto';
import { StoreParamsService } from '../store-params/store-params.service';
import { CreateEasebuzzVAPaymentResponse } from './dto/create-virtual-account-payment-response.dto';
import { StoreStatus } from './enum/store.status';
import { UserStoreMappingDto } from './dto/internal-user-store-mapping.dto';
import * as process from 'process';
import { ZoneLogsService } from '../zones/zone-logs.service';
import { CreateStoreWarehouseResponse } from './dto/create-store-warehouse-response.dto';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { SearchService } from '../search/search.service';
import { WarehouseStoreBean } from './dto/warehouse-store.bean';
import { WalletListItemResponse } from './dto/wallet-list-item-response.class';
import { ClusterEntity } from './entity/clusters.entity';
import { RestApiService } from 'src/common/rest-api.service';
import { SocietyDto } from "./dto/society.dto";

@Injectable()
export class StoreService {
  private readonly logger = new CustomLogger(SearchService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,

    private dataSource: DataSource,
    private configService: ConfigService<Config, true>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(ClusterEntity)
    private readonly clusterRepository: Repository<ClusterEntity>,
    private readonly storeParamsService: StoreParamsService,
    private zoneService: ZoneService,
    private zoneLogsService: ZoneLogsService,
    private restApiService: RestApiService,
  ) {}

  checkStoreTime(store: StoreEntity): boolean {
    const currTime = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return currTime >= store.open_time && currTime <= store.close_time;
  }

  public async saveStoreInWareHouse(
    warehousePayload: object,
  ): Promise<CreateStoreWarehouseResponse> {
    try {
      const warehouseURL = `${process.env.WAREHOUSE_URL}/api/v1/store`;
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': process.env.RZ_AUTH_KEY,
        },
        data: warehousePayload,
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while upserting store in warehouse for warehousePayload : ' +
          JSON.stringify(warehousePayload),
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async CreateWhStoreMapping(warehousePayload: object) {
    try {
      const warehouseURL = `${process.env.WAREHOUSE_URL}/api/v1/store/wh-mapping`;
      const axiosOptions = {
        url: warehouseURL,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': process.env.RZ_AUTH_KEY,
        },
        data: warehousePayload,
        timeout: this.configService.get<number>('default_timeout'),
      };
      const result = await axios(axiosOptions);
      return result;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while upserting store in warehouse for warehousePayload : ' +
          JSON.stringify(warehousePayload),
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createStore(
    newStore: NewStoreDto,
    createdBy: string,
  ): Promise<StoreEntity> {
    const store: StoreEntity = new StoreEntity();
    Object.assign(store, {
      ...newStore,
      updatedBy: createdBy,
    });
    store.createdBy = createdBy;
    store.approvedBy = createdBy;
    store.status = StoreStatus.APPROVED;
    if (newStore.open_time != null) {
      store.deliveryOpenTime = newStore.open_time;
    }
    return await this.createNewStore(store, true, true);
  }

  public async createNewStore(
    store: StoreEntity,
    saveWhStore: boolean,
    isToCreateUsm = false,
    additionalUserId: string = null,
  ): Promise<StoreEntity> {
    let whData = null;
    if (saveWhStore) {
      whData = await this.buildDataAndSaveInWarehouse(store);
    }
    if (whData != null && store.store_id == null) {
      store.store_id = String(whData.id);
    }
    if (
      store.clusterId == null &&
      store.location != null &&
      'coordinates' in store.location &&
      store.location.coordinates.length > 1
    ) {
      store.clusterId = await this.getClusterIdFromLatLong(
        String(store.location.coordinates[1]),
        String(store.location.coordinates[0]),
      );
    }
    await this.addEasebuzzVirtualAccountIfEligible(store);
    await this.storeRepository.save(store);
    if (isToCreateUsm) {
      await this.createOwnerStoreMapping(store);
      if (additionalUserId != null) {
        await this.createUserStoreMapping(store.store_id, additionalUserId);
      }
    }
    return store;
  }

  async getStores(filters: any, userId: string): Promise<StoreEntity[]> {
    const filter: FindOptionsWhere<StoreEntity> = {};
    if (filters.id) {
      filter.id = filters.id;
    }
    if (filters.store_id) {
      filter.store_id = In(filters.store_id.split(','));
    }
    if (filters.lithos_ref) {
      filter.lithos_ref = filters.lithos_ref;
    }
    if (filters.is_active) {
      filter.isActive = Boolean(Number(filters.is_active));
    }
    if (filters.store_type) {
      filter.store_type = filters.store_type;
    }
    if (filters.status) {
      filter.status = In(filters.status.split(','));
    }
    if (filters.city) {
      filter.city = filters.city;
    }
    if (filters.ownerId) {
      filter.ownerId = filters.ownerId;
    }
    if (filters.get_user_approved) {
      filter.approvedBy = userId;
    }
    if (filters.hasEasebuzzVA === false) {
      filter.easebuzzQrCode = IsNull();
      filter.easebuzzVirtualAccountId = IsNull();
    }
    return await this.storeRepository.find({
      where: filter,
      order: { createdAt: 'DESC' },
    });
  }

  async getStoreByStoreId(storeId: string) {
    return await this.storeRepository.findOne({ where: { store_id: storeId } });
  }

  async updateStore(existingStore: StoreEntity, updatedStore: StoreEntity) {
    updatedStore = await this.updateExistingStore(updatedStore, true, null);
    if (existingStore.isActive == true && updatedStore.isActive == false) {
      await this.inactivateStoreSession(updatedStore.store_id);
    }
    return updatedStore;
  }

  public async updateExistingStore(
    store: StoreEntity,
    saveWhStore: boolean,
    userIdMappingList: string[] = null,
  ): Promise<StoreEntity> {
    let whData = null;
    if (saveWhStore) {
      whData = await this.buildDataAndSaveInWarehouse(store);
    }
    if (whData != null && store.store_id == null) {
      store.store_id = String(whData.id);
    }
    if (
      store.location != null &&
      'coordinates' in store.location &&
      store.location.coordinates.length > 1
    ) {
      store.clusterId = await this.getClusterIdFromLatLong(
        String(store.location.coordinates[1]),
        String(store.location.coordinates[0]),
      );
    }
    await this.addEasebuzzVirtualAccountIfEligible(store);
    store = await this.storeRepository.save(store);
    if (userIdMappingList != null) {
      for (const userId of userIdMappingList) {
        await this.createUserStoreMapping(store.store_id, userId);
      }
    }
    return store;
  }
  async getWarehouseList() {
    const warehouseURL = `${process.env.WAREHOUSE_URL}/api/v1/warehouses`;
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

  async getNearestStore(lat: string, long: string, userId: string) {
    const zone = await this.zoneService.getZone(lat, long);
    if (zone == null) {
      await this.zoneLogsService.save(lat, long, userId);
      return {
        store_found: false,
        message: 'Address out of serviceable zone.',
      };
    }
    let storeTiming = null;
    const nearestStores = await this.storeRepository
      .createQueryBuilder('stores')
      .select([
        'stores.name, stores.store_id, stores.id, stores.is_bounded, stores.max_eta, stores.min_eta, is_open, open_time, close_time, is_open, stores.location::json',
      ])
      .where('is_active = true and store_id = :storeId')
      .setParameters({
        storeId: zone.storeid,
      })
      .execute();

    if (!nearestStores.length)
      return { store_found: false, message: 'no serving stores found' };

    if (nearestStores.length != 0) {
      const response = nearestStores[0];
      response['store_found'] = true;
      response['message'] = true;
      response['zoneId'] = zone['id'];
      response['distance'] = zone['distance'];
      if (response.open_time && response.close_time) {
        storeTiming = this.checkStoreTime(nearestStores[0]);
        response['message'] = storeTiming.message;
        response['timer'] = storeTiming.timer;
        response['is_open'] = storeTiming.isOpen;
      }
      return response;
    } else {
      return { store_found: false, message: 'no serving stores found' };
    }
  }

  async getNearestStores(lat: string, long: string, radius: number) {
    const userLocation = {
      type: 'Point',
      coordinates: [long, lat],
    };

    const nearestStores = await this.storeRepository
      .createQueryBuilder('stores')
      .select([
        'stores.name, stores.store_id, stores.id, stores.is_bounded, stores.max_eta, stores.min_eta, to_json(stores.location) as location, stores.addressLine_1, stores.addressLine_2, stores.landmark, stores.city, stores.state, stores.pincode, stores.contact_number',
        '(ST_DistanceSphere(location, ST_SetSRID(ST_GeomFromGeoJSON(:userLocation), ST_SRID(location)))/1000) AS distance',
      ])
      .where(
        `(ST_DistanceSphere(location, ST_SetSRID(ST_GeomFromGeoJSON(:userLocation), ST_SRID(location)))/1000) < :range`,
      )
      .orderBy('distance', 'ASC')
      .setParameters({
        userLocation: JSON.stringify(userLocation),
        range: radius,
      })
      .getRawMany();
    return nearestStores.map((store) => {
      const cordinates = store.location.coordinates;
      delete store.location;
      return { ...store, lat: cordinates[1], long: cordinates[0] };
    });
  }

  async getDistinctKeys() {
    const stores = await this.storeRepository.find({
      select: ['state', 'city', 'store_id', 'id'],
    });
    const cities = new Set();
    const states = new Set();
    const storesArr = [];
    stores.map((store) => {
      cities.add(store.city);
      states.add(store.state);
      storesArr.push({ [store.id]: store.store_id });
    });
    return {
      cities: Array.from(cities),
      states: Array.from(states),
      stores: storesArr,
    };
  }

  async getServingStores(coordinates: CordinatesDto) {
    const userLocation = {
      type: 'Point',
      coordinates: [coordinates.long, coordinates.lat],
    };

    const servingStores = await this.storeRepository
      .createQueryBuilder('stores')
      .select([
        'name, store_id, owner_name, stores.is_open, open_time, close_time, location::json, address_line_1, address_line_2, landmark, city, state, pincode',
        'contact_number, images, metadata, offer_images, (ST_DistanceSphere(location, ST_SetSRID(ST_GeomFromGeoJSON(:userLocation), ST_SRID(location)))) AS distanceFromStore',
      ])
      .where(
        'is_active = TRUE AND is_bounded = TRUE AND ST_Intersects(boundry,ST_GeomFromGeoJSON(:userLocation))',
      )
      .setParameters({
        userLocation: JSON.stringify(userLocation),
      })
      .orderBy('distanceFromStore', 'ASC')
      .getRawMany();

    return servingStores.map((store) => {
      const coordinates = store.location.coordinates;
      store['approxDistance'] =
        Number(store['distancefromstore']).toFixed(0) + ' Metres';
      if (
        store['distancefromstore'] != null &&
        store['distancefromstore'] > 1000
      ) {
        store['approxDistance'] =
          String(Number(store['distancefromstore'] / 1000).toFixed(1)) + ' KM';
      }
      let open_now = false;
      if (store.open_time != null && store.close_time != null) {
        const current_time = moment().utcOffset(330).format('hh:mm A');
        store.open_time = moment(store.open_time, 'HH:mm').format('hh:mm A');
        store.close_time = moment(store.close_time, 'HH:mm').format('hh:mm A');
        open_now = moment(current_time, 'hh:mm A').isBetween(
          moment(store.open_time, 'hh:mm A'),
          moment(store.close_time, 'hh:mm A'),
          null,
          '[]',
        );
      }
      const address =
        (!store.address_line_1 ? '' : store.address_line_1) +
        (!store.address_line_2 ? '' : ', ' + store.address_line_2) +
        (!store.landmark ? '' : ', ' + store.landmark) +
        (!store.city ? '' : ', ' + store.city) +
        (!store.state ? '' : ', ' + store.state) +
        (!store.pincode ? '' : ', ' + store.pincode);
      const amenities =
        store.metadata != null && store.metadata.amenities != null
          ? store.metadata.amenities
          : [];
      delete store.location;
      delete store.address_line_1;
      delete store.address_line_2;
      delete store.landmark;
      delete store.city;
      delete store.state;
      delete store.pincode;
      delete store.metadata;
      return {
        ...store,
        lat: coordinates[1],
        long: coordinates[0],
        open_now: store.is_open == false ? false : open_now,
        address: address,
        amenities: amenities,
      };
    });
  }

  async getStoreFromStoreId(storeId: string): Promise<StoreEntity> {
    return this.storeRepository.findOne({
      where: { store_id: storeId, isActive: true },
    });
  }

  async getStoreFromStoreIdIgnoreActive(storeId: string): Promise<StoreEntity> {
    return this.storeRepository.findOne({
      where: { store_id: storeId },
    });
  }
  async buildStoreResponse(
    store: StoreEntity,
    distance: number,
  ): Promise<StoreResponse> {
    const storeResponse = new StoreResponse();
    Object.assign(storeResponse, store); // add mapper
    storeResponse.store_found = store != null;
    storeResponse.distance = distance;
    const isStoreOpenByTime = this.checkStoreTime(store);
    storeResponse.message = await this.storeParamsService.getStringParamValue(
      'STORE_CLOSED_MESSAGE',
      "... products go live at 7am for tomorrow's delivery",
    );
    storeResponse.timer = null;
    storeResponse.is_open = store.is_open == true ? isStoreOpenByTime : false;
    return storeResponse;
  }

  public async inactivateStoreSession(storeId: string) {
    try {
      await this.restApiService.makeRequest({
        url: `${process.env.INTERNAL_BASE_URL}/auth/franchise-store/inactivate-session/${storeId}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while inactivating session for mapped users',
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCategories() {
    const warehouseURL = `${process.env.WAREHOUSE_URL}/api/v1/franchise-stores/inventory-prices/categories`;
    try {
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': process.env.RZ_AUTH_KEY,
        },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching categories from warehouse',
        e,
      );
      throw new HttpException(
        {
          message:
            'Something went wrong while fetching category from Warehouse.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async save(storeData) {
    return this.storeRepository.save(storeData);
  }

  public async createEasebuzzVirtualAccount(
    storeId: string,
  ): Promise<CreateEasebuzzVAPaymentResponse> {
    const response: CreateEasebuzzVAPaymentResponse =
      new CreateEasebuzzVAPaymentResponse();
    try {
      const paymentServiceURL = `${process.env.INTERNAL_BASE_URL}/payments/easebuzz/virtual-account`;
      const result = await this.restApiService.makeRequest({
        url: paymentServiceURL,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
        data: {
          entityId: storeId,
          entityType: 'STORE',
          label: storeId,
        },
      });
      Object.assign(response, result);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while creating easebuzz virtual account: ',
        e,
      );
    }
    return response;
  }

  public async addEasebuzzVirtualAccountIfEligible(
    store: StoreEntity,
  ): Promise<void> {
    if (
      store.store_id != null &&
      (store.status == StoreStatus.APPROVED ||
        store.status == StoreStatus.VERIFIED ||
        store.status == StoreStatus.INFO_VERIFIED) &&
      (store.easebuzzVirtualAccountId == null || store.easebuzzQrCode == null)
    ) {
      const easebuzzVirtualAccountInfo: CreateEasebuzzVAPaymentResponse =
        await this.createEasebuzzVirtualAccount(store.store_id);
      if (
        easebuzzVirtualAccountInfo.id &&
        easebuzzVirtualAccountInfo.qrCodeUrl
      ) {
        store.easebuzzVirtualAccountId = easebuzzVirtualAccountInfo.id;
        store.easebuzzQrCode = easebuzzVirtualAccountInfo.qrCodeUrl;
      }
    }
  }

  async getStoresByOwnerId(userId: string) {
    return this.storeRepository.find({
      where: { ownerId: userId, isActive: true },
    });
  }

  private async createOwnerStoreMapping(store: StoreEntity) {
    try {
      const internalUsmBody = new UserStoreMappingDto(
        store.ownerId,
        store.store_id,
        true,
      );
      await this.setUserStoreMappingInternal(internalUsmBody);
    } catch (e) {}
  }

  async createUserStoreMapping(storeId: string, userId: string) {
    try {
      const internalUsmBody = new UserStoreMappingDto(userId, storeId, true);
      await this.setUserStoreMappingInternal(internalUsmBody);
    } catch (e) {}
  }

  async getStoresByStoreIds(storeIds: string[]) {
    return this.storeRepository.find({
      where: { store_id: In(storeIds) },
    });
  }
  async getSkus(storeId: string) {
    const warehouseURL =
      `${process.env.WAREHOUSE_URL}/api/v1/catalog/store/` + storeId;
    try {
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': process.env.RZ_AUTH_KEY,
        },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching catalog for storeId : ' + storeId,
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong while fetching data from Warehouse.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFranchiseStores() {
    const warehouseURL = `${process.env.WAREHOUSE_URL}/api/v1/stores?storeType=FRANCHISE`;
    try {
      return await this.restApiService.makeRequest({
        url: warehouseURL,
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'rz-auth-key': process.env.RZ_AUTH_KEY,
        },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching franchise stores',
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong while fetching data from Warehouse.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUnverifiedFranchiseStores(
    page: number,
    limit: number,
    query: string,
  ) {
    const whereClause = !query
      ? { status: StoreStatus.UNVERIFIED, isActive: true }
      : [
          {
            name: ILike(`%${query}%`),
            status: StoreStatus.UNVERIFIED,
            isActive: true,
          },
          {
            store_id: ILike(`%${query}%`),
            status: StoreStatus.UNVERIFIED,
            isActive: true,
          },
        ];
    const [stores, total] = await this.storeRepository.findAndCount({
      where: whereClause,
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

  async getFranchiseStoreByStoreId(storeId: string): Promise<StoreEntity> {
    return await this.storeRepository.findOne({
      where: { store_id: storeId, isActive: true },
    });
  }

  async getFranchiseStoreById(id: string): Promise<StoreEntity> {
    return await this.storeRepository.findOne({
      where: { id: id, isActive: true },
    });
  }

  async saveFranchiseStore(storeData) {
    return this.storeRepository.save(storeData);
  }

  async getUnverifiedFranchiseStoresFromOwnerId(ownerId: string) {
    return await this.storeRepository.find({
      where: {
        ownerId: ownerId,
        status: StoreStatus.UNVERIFIED,
        isActive: true,
      },
    });
  }

  async getFranchiseStoresFromOwnerId(ownerId: string) {
    return await this.storeRepository.find({
      where: {
        ownerId: ownerId,
        isActive: true,
      },
    });
  }

  async setUserStoreMappingInternal(userStoreMappingRequest) {
    try {
      await this.restApiService.makeRequest({
        url: `${process.env.INTERNAL_BASE_URL}/auth/internal/user-store-mapping`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
        data: userStoreMappingRequest,
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while updating user store mapping',
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUserInternal(userId, userName) {
    try {
      await this.restApiService.makeRequest({
        url: `${process.env.INTERNAL_BASE_URL}/auth/user/${userId}`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
        data: { name: userName },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while updating user data',
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserInternal(userId) {
    try {
      return await this.restApiService.makeRequest({
        url: `${process.env.INTERNAL_BASE_URL}/auth/internal/user/${userId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching user data for userId : ' + userId,
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserByPhone(phone_number_full: string) {
    try {
      return await this.restApiService.makeRequest({
        url:
          this.configService.get<string>('internal_base_url') +
          '/auth/internal/user',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configService.get<string>(
            'internal_token',
          )}`,
        },
        data: { phone_number: phone_number_full },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching user data for phone : ' +
          phone_number_full,
        e,
      );
      throw new HttpException(
        { message: 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async createAmStoreMapping(amUserId: string, storeId: string) {
    try {
      await this.restApiService.makeRequest({
        url:
          this.configService.get<string>('internal_base_url') +
          '/auth/am-store-mapping',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configService.get<string>(
            'internal_token',
          )}`,
        },
        data: { storeId: storeId, amUserId: amUserId, onlyInsert: true },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        `Something went wrong while creating am store mapping storeId: ${storeId} and amUserId: ${amUserId}` +
          e,
      );
    }
  }

  private buildWarehouseStorePayload(store: StoreEntity) {
    const warehouseStoreBean = new WarehouseStoreBean();
    warehouseStoreBean.id =
      store.store_id != null ? parseInt(store.store_id) : null;
    warehouseStoreBean.name = store.name;
    warehouseStoreBean.address = store.addressLine_1 + ' ' + store.city;
    warehouseStoreBean.storeType = 'FRANCHISE';
    warehouseStoreBean.openTime = store.open_time;
    warehouseStoreBean.active = store.isActive ? '1' : '0';
    warehouseStoreBean.storeCategory = store.storeCategory;
    warehouseStoreBean.isSrpStore = 0;
    warehouseStoreBean.storeImages = store.storeImages;
    warehouseStoreBean.storeVideos = store.storeVideos;
    warehouseStoreBean.storeDeliveryType = store.storeDeliveryType;
    warehouseStoreBean.whId = 1;
    warehouseStoreBean.gstNumber = store.metadata.gstNumber;
    warehouseStoreBean.panNumber = store.metadata.gstNumber;
    if (
      store.location != null &&
      'coordinates' in store.location &&
      store.location.coordinates.length > 1
    ) {
      warehouseStoreBean.latitude = String(store.location.coordinates[1]);
      warehouseStoreBean.longitude = String(store.location.coordinates[0]);
    }
    return warehouseStoreBean;
  }

  private async buildDataAndSaveInWarehouse(store: StoreEntity) {
    const warehousePayload = this.buildWarehouseStorePayload(store);
    return await this.saveStoreInWareHouse(warehousePayload);
  }

  async getNearbyStoreIdsFromLocation(
    storeId: string,
    lat: string,
    long: string,
    searchRadius: number,
  ): Promise<{ store_id: string; distance: number }[]> {
    const locationQuery = this.storeRepository
      .createQueryBuilder('stores')
      .select([
        'store_id, (ST_DistanceSphere(location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))) AS distance',
      ])
      .where(
        `(ST_DistanceSphere(location, ST_SetSRID(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), ST_SRID(location)))) < :searchRadius`,
      );
    if (storeId != null) {
      locationQuery.andWhere('store_id <> :storeId');
    }
    locationQuery
      .setParameter('latitude', lat)
      .setParameter('longitude', long)
      .setParameter('searchRadius', searchRadius);
    if (storeId != null) {
      locationQuery.setParameter('storeId', storeId);
    }
    const servingStores: { store_id: string; distance: number }[] =
      await locationQuery.orderBy('distance', 'ASC').getRawMany();
    return servingStores;
  }

  async getStoreOrderDetails(nearbyStoreIds: string[]) {
    try {
      return await this.restApiService.makeRequest({
        url:
          this.configService.get<string>('internal_base_url') +
          '/orders/franchise/orders',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configService.get<string>(
            'internal_token',
          )}`,
        },
        data: { storeIds: nearbyStoreIds },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching store order details.',
        e,
      );
    }
  }

  async fetchStoreWalletsInternal(
    storeIds: string[],
  ): Promise<WalletListItemResponse[]> {
    try {
      return await this.restApiService.makeRequest({
        url:
          this.configService.get<string>('internal_base_url') +
          '/payments/wallet/internal',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configService.get<string>(
            'internal_token',
          )}`,
        },
        data: { storeIds: storeIds },
      });
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while fetching store order details.',
        e,
      );
    }
  }

  private async getClusterIdFromLatLong(latitude: string, longitude: string) {
    try {
      const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
      const cluster = await this.clusterRepository
        .createQueryBuilder('clusters')
        .select(['clusters.id AS id'])
        .where(
          'active = 1 AND ST_Intersects(polygon,ST_GeomFromGeoJSON(:userLocation))',
        )
        .setParameters({
          userLocation: JSON.stringify(location),
        })
        .getRawOne();
      if (cluster == null) {
        return null;
      }
      return cluster.id;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'something went wrong while fetching cluster.',
      );
      return null;
    }
  }

  async getUserAudiences(userId) {
    try {
      return await this.restApiService.makeRequest({
        url: `${process.env.INTERNAL_BASE_URL}/auth/internal/user/${userId}/audience`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });
    } catch (e) {
      this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong while fetching user audiences for userId : ' + userId,
          e,
      );
      throw new HttpException(
          { message: 'Something went wrong.' },
          HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

    async getAudiences(ids) {
      try {
        return this.restApiService.makeRequest({
          url: `${process.env.INTERNAL_BASE_URL}/auth/internal/audience?ids=${ids}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
          },
        });
      } catch (e) {
        this.logger.error(
            this.asyncContext.get('traceId'),
            'Something went wrong while fetching  audiences ',
            e,
        );
        throw new HttpException(
            { message: 'Something went wrong.' },
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
  async getSocietyDtos(societyIds: number[]) : Promise<SocietyDto[]> {
    const ids = societyIds.join(',');
    try {
      return this.restApiService.makeRequest({
        url: `${process.env.INTERNAL_BASE_URL}/auth/society/internal?societyIds=${ids}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        },
      });
    } catch (e) {
      this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong while fetching  societies ',
          e,
      );
      throw new HttpException(
          { message: 'Something went wrong.' },
          HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
