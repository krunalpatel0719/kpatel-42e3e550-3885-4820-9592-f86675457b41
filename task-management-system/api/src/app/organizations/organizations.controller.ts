import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, Roles, RolesGuard } from '@task-management-system/auth';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async create(@Body() dto: CreateOrganizationDto, @Request() req) {
    // Check if user can create org with specified parent
    if (dto.parentId) {
      const hasAccess = await this.organizationsService.checkOrgAccess(
        req.user.role,
        req.user.organizationId,
        dto.parentId,
      );

      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have permission to create an organization under this parent',
        );
      }
    }

    return this.organizationsService.create(dto);
  }

  @Get()
  async findAll() {
    // Return all organizations for registration page
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
  async findOne(@Param('id') id: string, @Request() req) {
    const orgId = +id;

    // Check if user has access to this organization
    const hasAccess = await this.organizationsService.checkOrgAccess(
      req.user.role,
      req.user.organizationId,
      orgId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to view this organization',
      );
    }

    return this.organizationsService.findOne(orgId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Request() req,
  ) {
    const orgId = +id;

    // Check if user has access to this organization
    const hasAccess = await this.organizationsService.checkOrgAccess(
      req.user.role,
      req.user.organizationId,
      orgId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to update this organization',
      );
    }

    // If changing parent, check access to new parent
    if (dto.parentId !== undefined && dto.parentId !== null) {
      const hasParentAccess = await this.organizationsService.checkOrgAccess(
        req.user.role,
        req.user.organizationId,
        dto.parentId,
      );

      if (!hasParentAccess) {
        throw new ForbiddenException(
          'You do not have permission to set this parent organization',
        );
      }
    }

    return this.organizationsService.update(orgId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async remove(@Param('id') id: string) {
    await this.organizationsService.remove(+id);
    return { message: 'Organization deleted successfully' };
  }
}
