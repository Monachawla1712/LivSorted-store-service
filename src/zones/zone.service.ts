import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ZoneEntity } from './entity/zone.entity';
import { CreateZoneDto } from './dto/createZone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateZoneDto } from './dto/updateZone.dto';
import { CustomLogger } from '../common/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Injectable()
export class ZoneService {
  private readonly logger = new CustomLogger(ZoneService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(ZoneEntity)
    private zoneRepository: Repository<ZoneEntity>,
  ) {}

  async getZone(lat: string, long: string) {
    try {
      const userLocation = {
        type: 'Point',
        coordinates: [long, lat],
      };
      const zone = await this.zoneRepository
        .createQueryBuilder('zones')
        .select([
          'zones.id AS id',
          '(ST_DistanceSphere(drop_point, ST_SetSRID(ST_GeomFromGeoJSON(:userLocation), ST_SRID(drop_point)))/1000) AS distance',
          'zones.store_id AS storeId',
        ])
        .where(
          'is_active = TRUE AND ST_Intersects(zone_polygon,ST_GeomFromGeoJSON(:userLocation))',
        )
        .setParameters({
          userLocation: JSON.stringify(userLocation),
        })
        .getRawOne();

      if (zone == undefined) {
        return null;
      }

      return zone;
    } catch (e) {
      return null;
    }
  }

  async createZone(zone: CreateZoneDto, updatedBy): Promise<boolean> {
    const coordinatesString = zone.zonePolygon.slice(10, -2);
    const coordinates = coordinatesString.split(', ').map((pointString) => {
      return pointString.split(' ').map((coord) => parseFloat(coord));
    });

    const polygonGeoJSON = {
      type: 'Polygon',
      coordinates: [coordinates],
    };

    const coordinatesString1 = zone.dropPoint.slice(7, -1);
    const coordinates1 = coordinatesString1
      .split(' ')
      .map((coord) => parseFloat(coord));

    const pointGeoJSON = {
      type: 'Point',
      coordinates: coordinates1,
    };

    zone.zonePolygon = polygonGeoJSON;
    zone.dropPoint = pointGeoJSON;

    await this.zoneRepository.save({
      id: zone.name,
      ...zone,
      store_id: zone.storeId,
      updatedBy: updatedBy,
    });
    return true;
  }

  async updateZone(
    zone: string,
    zoneData: UpdateZoneDto,
    updatedBy: string,
  ): Promise<boolean> {
    try {
      if (zoneData.zonePolygon) {
        const coordinatesString = zoneData.zonePolygon.slice(10, -2);
        const coordinates = coordinatesString.split(', ').map((pointString) => {
          return pointString.split(' ').map((coord) => parseFloat(coord));
        });

        const polygonGeoJSON = {
          type: 'Polygon',
          coordinates: [coordinates],
        };
        zoneData.zonePolygon = polygonGeoJSON;
      }
      if (zoneData.dropPoint) {
        const coordinatesString = zoneData.dropPoint.slice(7, -1);
        const coordinates = coordinatesString
          .split(' ')
          .map((coord) => parseFloat(coord));

        const pointGeoJSON = {
          type: 'Point',
          coordinates: coordinates,
        };
        zoneData.dropPoint = pointGeoJSON;
      }
      const updateResponse = await this.zoneRepository
        .createQueryBuilder('stores')
        .update({ ...zoneData, updatedBy })
        .where({
          id: zone,
        })
        .returning('*')
        .execute();
      if (!updateResponse.raw[0]) {
        throw new HttpException(
          { message: 'Zone not found' },
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong while updating zone for zoneData : ' +
          JSON.stringify(zoneData),
        e,
      );
    }
    return true;
  }

  async getZones(): Promise<ZoneEntity[]> {
    const zones = await this.zoneRepository.find();
    return zones;
  }
}
