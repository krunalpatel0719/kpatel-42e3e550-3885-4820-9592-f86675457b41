import { IsEmail, IsEnum, IsNotEmpty, IsNumber, MinLength } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsNumber()
  @IsNotEmpty()
  organizationId: number;
}
