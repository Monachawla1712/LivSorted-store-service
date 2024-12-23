import {
    IsNotEmpty,
    IsNumber,
} from 'class-validator';

export class SocietyDto {
    @IsNumber()
    @IsNotEmpty()
    id: number;

    @IsNumber()
    @IsNotEmpty()
    storeId: number;
}
