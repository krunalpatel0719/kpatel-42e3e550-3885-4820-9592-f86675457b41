import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, Roles, RolesGuard } from '@task-management-system/auth';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(+id);
    if (!user) {
      return { message: 'User not found' };
    }

    // Remove password hash from response
    const { passwordHash, ...result } = user;
    return result;
  }
}
