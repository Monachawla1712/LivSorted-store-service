import { IsNumber, IsString } from "class-validator";

export class SkuPerPcsWtDto {

    @IsString()
    skuCode: string;

    @IsNumber()
    perPcsWt: number;
}