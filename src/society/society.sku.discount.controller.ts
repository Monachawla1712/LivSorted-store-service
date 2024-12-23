import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { CustomLogger } from '../common/custom-logger';
import { SocietyService } from './society.service';
import { SocietySkuDiscountDto } from './dto/society.sku.discount.dto';

@Controller('society-sku-discount')
@UseFilters(HttpExceptionFilter)
export class SocietySkuDiscountController {
  private readonly logger = new CustomLogger(SocietySkuDiscountController.name);

  constructor(private societyService: SocietyService) {}
  @Post(':societyId')
  async createSocietySkuDiscountEntity(
    @Body() reqBody: SocietySkuDiscountDto,
    @Headers('userId') updatedBy: string,
    @Param('societyId') societyId,
  ) {
    await this.societyService.createSocietySkuDiscountEntity(
      societyId,
      reqBody,
      updatedBy,
    );
  }

  @Get(':societyId')
  async getSocietySkuDiscountEntity(@Param('societyId') societyId: string) {
    const entity = await this.societyService.getSocietySkuDiscountEntity(
      societyId,
    );
    if (!entity) {
      throw new NotFoundException(
        `Society SKU discount not found for society ID: ${societyId}`,
      );
    }
    return entity;
  }

  @Get()
  async getSocietySkuDiscountEntities() {
    return this.societyService.getSocietySkuDiscountEntities();
  }

  @Put(':societyId')
  async updateSocietySkuDiscountEntity(
    @Param('societyId') societyId: string,
    @Headers('userId') updatedBy: string,
    @Body() updateDto: SocietySkuDiscountDto,
  ) {
    const updatedEntity =
      await this.societyService.updateSocietySkuDiscountEntity(
        societyId,
        updateDto,
        updatedBy,
      );
    if (!updatedEntity) {
      throw new NotFoundException(
        `Society SKU discount not found for society ID: ${societyId}`,
      );
    }
    return updatedEntity;
  }
}
