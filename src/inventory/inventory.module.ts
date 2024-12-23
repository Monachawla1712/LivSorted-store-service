import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InternalInventoryController } from './internal.inventory.controller';
import { StoreService } from 'src/store/store.service';
import { ConfigService } from '@nestjs/config';
import { InventoryUpdateLogService } from './inventory-update-log.service';
import { InventoryUpdateLogEntity } from './entity/inventory-update-log.entity';
import { StoreEntity } from 'src/store/entity/store.entity';
import { RecommendationEntity } from './entity/recommendation.entity';
import { ZoneService } from '../zones/zone.service';
import { StoreParamsService } from '../store-params/store-params.service';
import { StoreParamsEntity } from '../store-params/store-params.entity';
import { ZoneLogsEntity } from '../zones/entity/zone-logs.entity';
import { ZoneEntity } from '../zones/entity/zone.entity';
import { OrderParamsEntity } from '../store-params/order-params.entity';
import { ProductsService } from '../products/products.service';
import { ProductEntity } from '../products/entity/products.entity';
import { Categories } from '../categories/entity/categories.entity';
import { SearchService } from '../search/search.service';
import { ProductSynonymsEntity } from '../search/entity/product-synonyms.entity';
import { ProductKeywordHitsEntity } from '../search/entity/product-keyword-hits.entity';
import { InventoryViewRequestEntity } from '../store/entity/inventory-view-request.entity';
import { RecommendationService } from './recommendation.service';
import { ZoneLogsService } from '../zones/zone-logs.service';
import { CategoriesService } from '../categories/categories.service';
import { ClusterEntity } from '../store/entity/clusters.entity';
import { CommonService } from '../common/common.service';
import { BulkUploadEntity } from '../common/entity/bulk-upload.entity';
import { PurchaseOrderEntity } from './entity/purchase-order.entity';
import { PurchaseOrderItemEntity } from './entity/purchase-order-item.entity';
import { PosPurchaseOrderController } from './pos-purchase-order.controller';
import { PosPurchaseOrderService } from './pos-purchase-order.service';
import { InventoryUpdatePriceLogEntity } from './entity/inventory-update-price-entity';
import { InventoryUpdatePriceLogService } from './inventory-update-price-log.service';
import { SocietySkuDiscountEntity } from '../society/entity/society.sku.discount.entity';
import { AudienceSkuDiscountEntity } from './entity/audience.sku.discount.entity';
import { InventoryDetailsUpdateLogService } from './inventory-details-update.service';
import { InventoryDetailsUpdateLogEntity } from './entity/inventory-details-update-log.entity';
import { RestApiService } from 'src/common/rest-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryEntity,
      InventoryUpdateLogEntity,
      RecommendationEntity,
      StoreParamsEntity,
      StoreEntity,
      ZoneLogsEntity,
      ZoneEntity,
      OrderParamsEntity,
      ProductEntity,
      Categories,
      ProductSynonymsEntity,
      ProductKeywordHitsEntity,
      InventoryViewRequestEntity,
      ClusterEntity,
      BulkUploadEntity,
      PurchaseOrderEntity,
      PurchaseOrderItemEntity,
      InventoryUpdatePriceLogEntity,
      SocietySkuDiscountEntity,
      AudienceSkuDiscountEntity,
      InventoryDetailsUpdateLogEntity,
    ]),
  ],
  providers: [
    InventoryService,
    StoreService,
    ConfigService,
    InventoryUpdateLogService,
    ZoneService,
    StoreParamsService,
    ProductsService,
    SearchService,
    InventoryUpdateLogService,
    RecommendationService,
    ZoneLogsService,
    CategoriesService,
    CommonService,
    PosPurchaseOrderService,
    InventoryUpdatePriceLogService,
    InventoryDetailsUpdateLogService,
    RestApiService,
  ],
  controllers: [
    InventoryController,
    InternalInventoryController,
    PosPurchaseOrderController,
  ],
})
export class InventoryModule {}
