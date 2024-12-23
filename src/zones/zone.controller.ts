import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ZoneService } from './zone.service';
import { CreateZoneDto } from './dto/createZone.dto';
import { UpdateZoneDto } from './dto/updateZone.dto';
import { ZoneEntity } from './entity/zone.entity';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller('zones')
export class ZoneController {
  private readonly logger = new CustomLogger(ZoneController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private zoneService: ZoneService,
  ) {}

  @Post()
  createZone(
    @Headers('userId') updatedBy,
    @Body() createZone: CreateZoneDto,
  ): Promise<boolean> {
    return this.zoneService.createZone(createZone, updatedBy);
  }

  @Get()
  async getZones(): Promise<ZoneEntity[]> {
    return await this.zoneService.getZones();
  }

  @Patch(':zone')
  async updateZone(
    @Body() zoneData: UpdateZoneDto,
    @Headers('userId') updatedBy,
    @Param('zone') zone: string,
  ): Promise<boolean> {
    const response = await this.zoneService.updateZone(
      zone,
      zoneData,
      updatedBy,
    );
    return response;
  }
}
