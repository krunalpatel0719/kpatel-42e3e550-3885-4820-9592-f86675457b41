import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}
