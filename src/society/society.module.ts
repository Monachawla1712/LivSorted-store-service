import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocietyEntity } from './entity/society.entity';
import { SocietyService } from './society.service';
import { SocietySkuDiscountController } from './society.sku.discount.controller';
import { SocietySkuDiscountEntity } from './entity/society.sku.discount.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocietyEntity, SocietySkuDiscountEntity]),
  ],
  providers: [SocietyService],
  controllers: [SocietySkuDiscountController],
})
export class SocietyModule {}
