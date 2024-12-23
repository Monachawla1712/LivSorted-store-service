import { Injectable, BadRequestException } from '@nestjs/common';
import { UpdatePromotionDto, NewPromotionDto } from './dto/promotion.dto';
import { PromotionsEntity } from './entity/promotions.entity';
import { DataSource, In } from 'typeorm';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';
@Injectable()
export class PromotionService {
  private readonly logger = new CustomLogger(PromotionService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private dataSource: DataSource,
  ) {}

  async createPromotion(
    newPromotion: NewPromotionDto,
    createdBy: string,
  ): Promise<PromotionsEntity> {
    const PromotionsEntityRepo =
      this.dataSource.getRepository(PromotionsEntity);
    return PromotionsEntityRepo.save({
      ...newPromotion,
      is_active: false,
      createdBy,
      updatedBy: createdBy,
    });
  }

  async updatePromotion(
    id: number,
    promotion: UpdatePromotionDto,
    updatedBy: string,
  ): Promise<PromotionsEntity> {
    const PromotionsEntityRepo =
      this.dataSource.getRepository(PromotionsEntity);

    const existingPromotion = await PromotionsEntityRepo.findOne({
      where: { id },
    });

    if (!existingPromotion)
      throw new BadRequestException('promotion not found');

    // If admin is activating a promotion
    if (promotion.is_active && !existingPromotion.is_active) {
      const exists = await PromotionsEntityRepo.findOne({
        where: {
          promotion_level: existingPromotion.promotion_level,
          promotion_value: existingPromotion.promotion_value,
          is_active: true,
        },
      });
      if (exists) throw new BadRequestException('promotion exists');
    }

    const res = await PromotionsEntityRepo.createQueryBuilder()
      .update({ ...promotion, updatedBy })
      .where({ id })
      .returning('name')
      .execute();
    return res.raw[0];
  }

  async getPromotions() {
    const PromotionsEntityRepo =
      this.dataSource.getRepository(PromotionsEntity);
    return PromotionsEntityRepo.find();
  }

  async getPromotionForInverntory(
    state: string,
    city: string,
    store_id: string,
  ) {
    const PromotionsEntityRepo =
      this.dataSource.getRepository(PromotionsEntity);
    const promotions = await PromotionsEntityRepo.find({
      where: {
        promotion_value: In([state, city, store_id, 'ALL']),
        is_active: true,
      },
    });
    const promotedSkus = promotions.map((p) => p.sku_codes);
    return promotedSkus.flat();
  }
}
