import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNumber()
  @IsNotEmpty()
  organizationId: number;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
