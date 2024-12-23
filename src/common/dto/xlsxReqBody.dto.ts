import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class XLXSReqBodyDto {
  @ApiProperty()
  @IsString()
  fileName: string;
}
