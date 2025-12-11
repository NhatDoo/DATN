import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsString()
  course_id: string; // hoặc product_id, tuỳ domain của bạn

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price_bigint: number;

}
