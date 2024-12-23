import { PrivilegeService } from './privilege/privilege.service';

require('newrelic');
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { StoreModule } from './store/store.module';
import { RolesGuard } from './common/roles.guard';
import { CatagoriesModule } from './categories/categories.module';
import { ProductEntity } from './products/entity/products.entity';
import { ProductsModule } from './products/products.module';
import { StoreEntity } from './store/entity/store.entity';
import { PromotionsEntity } from './promotions/entity/promotions.entity';
import { Categories } from './categories/entity/categories.entity';
import { InventoryModule } from './inventory/inventory.module';
import { InventoryEntity } from './inventory/entity/inventory.entity';
import { PromotionsModule } from './promotions/promotions.module';
import { RecommendationEntity } from './inventory/entity/recommendation.entity';
import { InventoryUpdateLogEntity } from './inventory/entity/inventory-update-log.entity';
import { ZoneEntity } from './zones/entity/zone.entity';
import { ZoneModule } from './zones/zone.module';
import { StoreParamsEntity } from './store-params/store-params.entity';
import { LoggingMiddleware } from './common/logging.middleware';
import { ZoneLogsEntity } from './zones/entity/zone-logs.entity';
import { OrderParamsEntity } from './store-params/order-params.entity';
import { ProductKeywordHitsEntity } from './search/entity/product-keyword-hits.entity';
import { ProductSynonymsEntity } from './search/entity/product-synonyms.entity';
import { SearchModule } from './search/search.module';
import { PrivilegeHandlerInterceptor } from './common/privilege.interceptor';
import { PrivilegeEndpointsEntity } from './privilege/entity/privilege-endpoints.entity';
import { InventoryViewRequestEntity } from './store/entity/inventory-view-request.entity';
import { AsyncContextModule } from '@nestjs-steroids/async-context';
import { ClusterEntity } from './store/entity/clusters.entity';
import { PurchaseOrderEntity } from './inventory/entity/purchase-order.entity';
import { PurchaseOrderItemEntity } from './inventory/entity/purchase-order-item.entity';
import { BulkUploadEntity } from './common/entity/bulk-upload.entity';
import { InventoryUpdatePriceLogEntity } from './inventory/entity/inventory-update-price-entity';
import { SocietyEntity } from './society/entity/society.entity';
import { SocietySkuDiscountEntity } from './society/entity/society.sku.discount.entity';
import { SocietyModule } from './society/society.module';
import {AudienceSkuDiscountEntity} from "./inventory/entity/audience.sku.discount.entity";
import { InventoryDetailsUpdateLogEntity } from './inventory/entity/inventory-details-update-log.entity';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('db_url'),
        entities: [
          StoreEntity,
          Categories,
          ProductEntity,
          InventoryEntity,
          PromotionsEntity,
          RecommendationEntity,
          InventoryUpdateLogEntity,
          ZoneEntity,
          StoreParamsEntity,
          ZoneLogsEntity,
          OrderParamsEntity,
          ProductKeywordHitsEntity,
          ProductSynonymsEntity,
          PrivilegeEndpointsEntity,
          InventoryViewRequestEntity,
          ClusterEntity,
          PurchaseOrderEntity,
          PurchaseOrderItemEntity,
          BulkUploadEntity,
          InventoryUpdatePriceLogEntity,
          SocietyEntity,
          SocietySkuDiscountEntity,
          AudienceSkuDiscountEntity,
          InventoryDetailsUpdateLogEntity,
        ],
        logging: false,
      }),
      inject: [ConfigService],
    }),
    StoreModule,
    CatagoriesModule,
    ProductsModule,
    InventoryModule,
    PromotionsModule,
    ZoneModule,
    SearchModule,
    SocietyModule,
    TypeOrmModule.forFeature([PrivilegeEndpointsEntity]),
    AsyncContextModule.forRoot(),
    CacheModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    LoggingMiddleware,
    PrivilegeService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrivilegeHandlerInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
