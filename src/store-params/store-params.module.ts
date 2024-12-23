import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreParamsService } from './store-params.service';
import { StoreParamsEntity } from './store-params.entity';
import { OrderParamsEntity } from './order-params.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreParamsEntity, OrderParamsEntity])],
  providers: [StoreParamsService],
})
export class StoreParamsModule {}
