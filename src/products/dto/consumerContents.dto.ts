import { IsNumber, IsOptional, IsString } from 'class-validator';

export class Grade {
  @IsString()
  name: string;

  @IsNumber()
  consumerBufferPerc: number;

  @IsNumber()
  logisticBufferPerc: number;

  @IsNumber()
  rtvBufferPerc: number;

  @IsNumber()
  cratingBufferPerc: number;

  @IsString()
  image: string;

  @IsString()
  description: string;
}

export class InventoryGrade {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class Identifier {
  @IsString()
  name: string;

  @IsString()
  image: string;
}

export class ConsumerContentsDto {
  identifier: Identifier;
  farmerStory: string;
  procurementType: string;
  procurementTypeExpiry: Date;
  moreAboutMe: string;
  classes: string[];
  origin: Origin;
  shelfLife: string;
  images: string[];
  productDetails: string;
  disclaimer: string;
  highlightType: HighlightType;
}

export class Origin {
  city: string;
  country: string;
  state: string;
}

export enum HighlightType {
  DOTTED = 'DOTTED',
  JUMPING = 'JUMPING',
  LOADING = 'LOADING',
  ELEVATED_BORDER = 'ELEVATED_BORDER',
}
