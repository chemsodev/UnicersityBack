// src/section/dto/create-section.dto.ts
import { IsNotEmpty, IsString, IsNumber, Length, Min } from "class-validator";
import { Transform, TransformFnParams } from "class-transformer";

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  specialty: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  level: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  code: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Transform(({ value }: TransformFnParams) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  departmentId: number;
}
