import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProductPerPcWtRequest {

    @IsNotEmpty()
    @IsNumber()
    per_pc_wt: number;
}
