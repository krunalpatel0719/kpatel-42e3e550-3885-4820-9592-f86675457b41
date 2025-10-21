import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@task-management-system/auth';
import { Roles, Role } from '@task-management-system/auth';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  async list(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    const effectiveLimit = limit || 200;
    return this.auditService.readRecentLogs(effectiveLimit);
  }
}
