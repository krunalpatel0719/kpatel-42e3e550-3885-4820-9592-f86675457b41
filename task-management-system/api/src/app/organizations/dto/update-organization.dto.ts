import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}
