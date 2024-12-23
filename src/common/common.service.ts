import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/configuration';
import { Readable } from 'stream';
import { parse } from 'papaparse';
import { BulkUploadEntity } from './entity/bulk-upload.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SocietySkuDiscountEntity } from '../society/entity/society.sku.discount.entity';

@Injectable()
export class CommonService {
  constructor(
    private configService: ConfigService<Config, true>,
    @InjectRepository(BulkUploadEntity)
    private readonly bulkUploadRepository: Repository<BulkUploadEntity>,
    @InjectRepository(SocietySkuDiscountEntity)
    private readonly societySkuDiscountRepository: Repository<SocietySkuDiscountEntity>,
  ) {}
  toTimestamp(strDate): number {
    const datum = Date.parse(strDate) / 1000;
    return datum;
  }

  mapper<Source, Destination>(
    source: Source,
    destination: any,
    patch: boolean,
  ): Destination {
    for (const property in source) {
      if (destination.hasOwnProperty(property)) {
        if (
          source[property] != null &&
          source[property].constructor != null &&
          source[property].constructor.name == 'Date'
        ) {
          destination[property] = source[property];
        } else if (typeof source[property] === 'object') {
          if (source[property] == null) {
            destination[property] = destination[property] || null;
          } else if (destination[property] == null) {
            destination[property] = source[property];
          } else {
            destination[property] = destination[property] || {};
            this.mapper(source[property], destination[property], patch);
          }
        } else {
          destination[property] = source[property];
        }
      }
    }
    return destination;
  }

  isPosRequest(appId: string) {
    return appId == 'com.example.pos_flutter_app';
  }

  cleanObject(source: any, finalKeySet: Set<string>) {
    for (const sourceKey of Object.keys(source)) {
      if (!finalKeySet.has(sourceKey)) {
        delete source[sourceKey];
      }
    }
    return source;
  }

  convertUtcToIst(utcTimestamp: Date): string {
    return moment(utcTimestamp)
      .add(5, 'hours')
      .add(30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
  }

  getClient() {
    return new S3Client({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: this.configService.get<string>('s3AccessKey'),
        secretAccessKey: this.configService.get<string>('s3SecretAccessKey'),
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    bucketName: string,
    fileName: string,
  ) {
    const fileBufferInBase64: string = file.buffer.toString('base64');
    const buffer = Buffer.from(fileBufferInBase64, 'base64');
    const s3Client = this.getClient();
    const fileImageName = `${bucketName}/${fileName}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.get<string>('s3BucketName'),
        Key: fileImageName,
        Body: buffer,
      }),
    );
    return `${this.configService.get<string>(
      's3CloudFrontBaseUrl',
    )}/${fileImageName}`;
  }

  async readCSVData(dataStream): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsedCsv = parse(dataStream, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  async readCsvData(file) {
    const fileBufferInBase64: string = file.buffer.toString('base64');
    const buffer = Buffer.from(fileBufferInBase64, 'base64');
    const dataStream = Readable.from(buffer);
    return await this.readCSVData(dataStream);
  }

  getHeaderMap(headerMapping: string) {
    const keyValuePairs = headerMapping.split(',');
    const resultMap = new Map();
    keyValuePairs.forEach((pair) => {
      const [value, key] = pair.split(':');
      resultMap.set(key, value);
    });
    return resultMap;
  }

  getCurrentIstMomentDateTime() {
    return moment(new Date()).add(5, 'hours').add(30, 'minutes');
  }

  convertToNumber(value: any) {
    return value != null ? Number(value) : null;
  }

  async createNewBulkUploadEntry(
    data: object[],
    module: string,
    userId: string,
  ) {
    const bulkUploadEntity = new BulkUploadEntity(data, module, userId);
    return this.bulkUploadRepository.save(bulkUploadEntity);
  }

  saveBulkUploadData(bulkUploadData: BulkUploadEntity) {
    return this.bulkUploadRepository.save(bulkUploadData);
  }

  async getBulkUploadEntryByKey(module: string, accessKey: string) {
    return this.bulkUploadRepository.findOne({
      where: { accessKey: accessKey, module: module, status: IsNull() },
    });
  }

  async getSocietySkuDiscountEntity(societyId: number) {
    const res = await this.societySkuDiscountRepository.find({
      where: [
        { societyId: -1, isActive: true },
        { societyId: societyId, isActive: true },
      ],
      order: {
        societyId: 'DESC',
      },
    });
    if (res && res.length > 0) {
      return res[0];
    }
    return null;
  }
  
  isVersionGreaterOrEqual(version1: string, version2: string): boolean {
    if (version1 == null || version2 == null) {
      return false;
    }
    const levels1 = version1.split('.');
    const levels2 = version2.split('.');
    
    const length = Math.max(levels1.length, levels2.length);
    for (let i = 0; i < length; i++) {
      const v1 = i < levels1.length ? parseInt(levels1[i], 10) : 0;
      const v2 = i < levels2.length ? parseInt(levels2[i], 10) : 0;
      if (v1 < v2) {
        return false;
      } else if (v1 > v2) {
        return true;
      }
    }
    return true;
  }

  getArrayFromCommaSeparatedString<T>(value: string): T[] {
    return value ? value.split(',').map(item => item.trim() as unknown as T) : [];
  }

  createDeepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }
}
