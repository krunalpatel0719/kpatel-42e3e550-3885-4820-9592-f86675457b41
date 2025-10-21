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
  Patch,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, Roles, RolesGuard } from '@task-management-system/auth';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  async create(@Body() dto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(
      dto,
      req.user.id,
      req.user.organizationId,
    );
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
  async findAll(@Request() req) {
    return this.tasksService.findAll(
      req.user.role,
      req.user.organizationId,
    );
  }

  @Get('organization/:orgId')
  @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
  async findByOrganization(@Param('orgId') orgId: string, @Request() req) {
    const organizationId = +orgId;

    // Check if user has access to this organization
    const hasAccess = await this.tasksService.checkTaskAccess(
      organizationId,
      req.user.role,
      req.user.organizationId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to view tasks from this organization',
      );
    }

    return this.tasksService.findByOrganization(organizationId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
  async findOne(@Param('id') id: string, @Request() req) {
    const taskId = +id;

    // Check if user has access to this task
    const hasAccess = await this.tasksService.checkTaskAccess(
      taskId,
      req.user.role,
      req.user.organizationId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to view this task',
      );
    }

    return this.tasksService.findOne(taskId);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req,
  ) {
    const taskId = +id;

    // Check if user has access to this task
    const hasAccess = await this.tasksService.checkTaskAccess(
      taskId,
      req.user.role,
      req.user.organizationId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to update this task',
      );
    }

    return this.tasksService.update(taskId, dto, req.user.id);
  }

  @Patch(':id/reorder')
  @Roles(Role.OWNER, Role.ADMIN)
  async reorder(
    @Param('id') id: string,
    @Body() dto: ReorderTaskDto,
    @Request() req,
  ) {
    return this.tasksService.reorder(
      +id,
      dto,
      req.user.role,
      req.user.organizationId,
    );
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    const taskId = +id;

    // Check if user has access to this task
    const hasAccess = await this.tasksService.checkTaskAccess(
      taskId,
      req.user.role,
      req.user.organizationId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    await this.tasksService.remove(taskId, req.user.id);
    return { message: 'Task deleted successfully' };
  }
}
