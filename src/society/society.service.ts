import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocietySkuDiscountEntity } from './entity/society.sku.discount.entity';
import { SocietyEntity } from './entity/society.entity';
import { SocietySkuDiscountDto } from './dto/society.sku.discount.dto';

@Injectable()
export class SocietyService {
  constructor(
    @InjectRepository(SocietySkuDiscountEntity)
    private readonly societySkuDiscountRepository: Repository<SocietySkuDiscountEntity>,
    @InjectRepository(SocietyEntity)
    private readonly societyEntityRepository: Repository<SocietyEntity>,
  ) {}
  async createSocietySkuDiscountEntity(
    societyId: string,
    reqBody: SocietySkuDiscountDto,
    updatedBy: string,
  ) {
    const existingEntry = await this.societySkuDiscountRepository.findOne({
      where: {
        societyId: Number.parseInt(societyId),
        isActive: true,
      },
    });

    if (existingEntry) {
      Object.assign(existingEntry, reqBody);
      existingEntry.updatedAt = new Date();
      existingEntry.updatedBy = updatedBy;
      return await this.societySkuDiscountRepository.save(existingEntry);
    } else {
      const societySkuDiscount = new SocietySkuDiscountEntity();
      Object.assign(societySkuDiscount, reqBody);
      societySkuDiscount.societyId = Number.parseInt(societyId);
      societySkuDiscount.updatedBy = updatedBy;
      return await this.societySkuDiscountRepository.save(societySkuDiscount);
    }
  }

  async updateSocietySkuDiscountEntity(
    societyId: string,
    reqBody: SocietySkuDiscountDto,
    updatedBy: string,
  ): Promise<SocietySkuDiscountEntity> {
    const existingEntry = await this.societySkuDiscountRepository.findOne({
      where: {
        societyId: Number.parseInt(societyId),
        isActive: true,
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('Society SKU discount not found');
    }

    if(reqBody.defaultDiscount) {
      existingEntry.defaultDiscount = reqBody.defaultDiscount;
    }
    existingEntry.updatedAt = new Date();
    existingEntry.updatedBy = updatedBy;

    const existingSkuDiscountMap = new Map(
      existingEntry.skuDiscounts.map((item) => [item.skuCode, item]),
    );

    const updatedSkuDiscounts = [...existingEntry.skuDiscounts];

    reqBody.skuDiscounts.forEach((newItem) => {
      if (existingSkuDiscountMap.has(newItem.skuCode)) {
        const existingItem = existingSkuDiscountMap.get(newItem.skuCode);
        existingItem.discount = newItem.discount;
      } else {
        updatedSkuDiscounts.push(newItem);
      }
    });

    existingEntry.skuDiscounts = updatedSkuDiscounts;

    return await this.societySkuDiscountRepository.save(existingEntry);
  }

  async getSocietySkuDiscountEntity(
    societyId: string,
  ): Promise<SocietySkuDiscountEntity | null> {
    return await this.societySkuDiscountRepository.findOne({
      where: { societyId: Number(societyId) },
    });
  }

  async getSocietySkuDiscountEntities() {
    return await this.societySkuDiscountRepository.find({});
  }
}
