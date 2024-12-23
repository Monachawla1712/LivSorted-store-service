import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulkUploadEntity } from './entity/bulk-upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BulkUploadEntity])],
  providers: [CommonService],
})
export class CommonModule {}
