import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../database/entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { Role } from '@task-management-system/auth';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly organizationsService: OrganizationsService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateTaskDto,
    userId: number,
    userOrgId: number,
  ): Promise<Task> {
    // Get next order index for this org if not provided
    const orderIndex = dto.orderIndex ?? await this.getNextOrderIndex(userOrgId, dto.status || TaskStatus.TODO);

    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      status: dto.status || TaskStatus.TODO,
      orderIndex,
      ownerId: userId,
      organizationId: userOrgId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Audit log
    await this.auditService.record(
      userId,
      'task.create',
      'Task',
      savedTask.id,
      { title: savedTask.title, status: savedTask.status }
    );

    return savedTask;
  }

  async findAll(
    userRole: Role,
    userOrgId: number,
  ): Promise<Task[]> {
    // Get accessible organizations
    const accessibleOrgs = await this.organizationsService.getAccessibleOrgs(
      userRole,
      userOrgId,
    );
    const orgIds = accessibleOrgs.map((org) => org.id);

    // Return tasks from accessible organizations, ordered by orderIndex
    return this.taskRepository.find({
      where: orgIds.map((orgId) => ({ organizationId: orgId })),
      relations: ['owner', 'organization'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findByOrganization(organizationId: number): Promise<Task[]> {
    return this.taskRepository.find({
      where: { organizationId },
      relations: ['owner', 'organization'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: number, dto: UpdateTaskDto, userId: number): Promise<Task> {
    const task = await this.findOne(id);

    // Track what changed
    const changes: any = {};
    if (dto.title !== undefined && dto.title !== task.title) {
      changes.title = { from: task.title, to: dto.title };
      task.title = dto.title;
    }
    if (dto.description !== undefined && dto.description !== task.description) {
      changes.description = { from: task.description, to: dto.description };
      task.description = dto.description;
    }
    if (dto.category !== undefined && dto.category !== task.category) {
      changes.category = { from: task.category, to: dto.category };
      task.category = dto.category;
    }
    if (dto.status !== undefined && dto.status !== task.status) {
      changes.status = { from: task.status, to: dto.status };
      task.status = dto.status;
    }
    if (dto.orderIndex !== undefined && dto.orderIndex !== task.orderIndex) {
      changes.orderIndex = { from: task.orderIndex, to: dto.orderIndex };
      task.orderIndex = dto.orderIndex;
    }

    const updatedTask = await this.taskRepository.save(task);

    // Audit log
    if (Object.keys(changes).length > 0) {
      await this.auditService.record(
        userId,
        'task.update',
        'Task',
        updatedTask.id,
        { changes }
      );
    }

    return updatedTask;
  }

  async remove(id: number, userId: number): Promise<void> {
    const task = await this.findOne(id);

    // Audit log before deletion
    await this.auditService.record(
      userId,
      'task.delete',
      'Task',
      task.id,
      { title: task.title, status: task.status }
    );

    await this.taskRepository.remove(task);
  }

  async reorder(
    id: number,
    dto: ReorderTaskDto,
    userRole: Role,
    userOrgId: number,
  ): Promise<Task> {
    const task = await this.findOne(id);

    // Check if user has access to this task
    const hasAccess = await this.organizationsService.checkOrgAccess(
      userRole,
      userOrgId,
      task.organizationId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to reorder this task');
    }

    const oldStatus = task.status;
    const newStatus = dto.newStatus || oldStatus;
    const newOrderIndex = dto.newOrderIndex;

    // If status changed, update order indices in both old and new status columns
    if (oldStatus !== newStatus) {
      // Shift tasks in old status column
      await this.shiftTasksDown(task.organizationId, oldStatus, task.orderIndex);

      // Insert into new status column
      await this.shiftTasksUp(task.organizationId, newStatus, newOrderIndex);

      task.status = newStatus;
      task.orderIndex = newOrderIndex;
    } else {
      // Same status, just reordering
      if (newOrderIndex < task.orderIndex) {
        // Moving up: shift tasks down between new and old positions
        await this.taskRepository
          .createQueryBuilder()
          .update(Task)
          .set({ orderIndex: () => 'orderIndex + 1' })
          .where('organizationId = :orgId', { orgId: task.organizationId })
          .andWhere('status = :status', { status: oldStatus })
          .andWhere('orderIndex >= :newIndex', { newIndex: newOrderIndex })
          .andWhere('orderIndex < :oldIndex', { oldIndex: task.orderIndex })
          .execute();
      } else if (newOrderIndex > task.orderIndex) {
        // Moving down: shift tasks up between old and new positions
        await this.taskRepository
          .createQueryBuilder()
          .update(Task)
          .set({ orderIndex: () => 'orderIndex - 1' })
          .where('organizationId = :orgId', { orgId: task.organizationId })
          .andWhere('status = :status', { status: oldStatus })
          .andWhere('orderIndex > :oldIndex', { oldIndex: task.orderIndex })
          .andWhere('orderIndex <= :newIndex', { newIndex: newOrderIndex })
          .execute();
      }

      task.orderIndex = newOrderIndex;
    }

    return this.taskRepository.save(task);
  }

  async checkTaskAccess(
    taskId: number,
    userRole: Role,
    userOrgId: number,
  ): Promise<boolean> {
    const task = await this.findOne(taskId);
    return this.organizationsService.checkOrgAccess(
      userRole,
      userOrgId,
      task.organizationId,
    );
  }

  private async getNextOrderIndex(
    organizationId: number,
    status: TaskStatus,
  ): Promise<number> {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .select('MAX(task.orderIndex)', 'maxIndex')
      .where('task.organizationId = :orgId', { orgId: organizationId })
      .andWhere('task.status = :status', { status })
      .getRawOne();

    return (result?.maxIndex ?? -1) + 1;
  }

  private async shiftTasksDown(
    organizationId: number,
    status: TaskStatus,
    fromIndex: number,
  ): Promise<void> {
    await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ orderIndex: () => 'orderIndex - 1' })
      .where('organizationId = :orgId', { orgId: organizationId })
      .andWhere('status = :status', { status })
      .andWhere('orderIndex > :fromIndex', { fromIndex })
      .execute();
  }

  private async shiftTasksUp(
    organizationId: number,
    status: TaskStatus,
    fromIndex: number,
  ): Promise<void> {
    await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ orderIndex: () => 'orderIndex + 1' })
      .where('organizationId = :orgId', { orgId: organizationId })
      .andWhere('status = :status', { status })
      .andWhere('orderIndex >= :fromIndex', { fromIndex })
      .execute();
  }
}
