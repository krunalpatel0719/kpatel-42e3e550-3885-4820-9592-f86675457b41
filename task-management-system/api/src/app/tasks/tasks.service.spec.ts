import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from '../database/entities/task.entity';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { Role } from '@task-management-system/auth';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let auditService: jest.Mocked<AuditService>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    category: 'Work',
    status: TaskStatus.TODO,
    orderIndex: 0,
    ownerId: 1,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: null,
    organization: null,
  };

  const mockOrganization = {
    id: 1,
    name: 'Test Org',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTaskRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      })),
    };

    const mockOrganizationsService = {
      getAccessibleOrgs: jest.fn(),
      checkOrgAccess: jest.fn(),
    };

    const mockAuditService = {
      record: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    organizationsService = module.get(OrganizationsService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        category: 'Work',
        status: TaskStatus.TODO,
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxIndex: null }),
      };

      taskRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createDto, 1, 1);

      expect(taskRepository.create).toHaveBeenCalled();
      expect(taskRepository.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        1,
        'task.create',
        'Task',
        mockTask.id,
        { title: mockTask.title, status: mockTask.status },
      );
      expect(result).toEqual(mockTask);
    });

    it('should create task with specified orderIndex', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        category: 'Work',
        status: TaskStatus.TODO,
        orderIndex: 5,
      };

      taskRepository.create.mockReturnValue({ ...mockTask, orderIndex: 5 });
      taskRepository.save.mockResolvedValue({ ...mockTask, orderIndex: 5 });

      await service.create(createDto, 1, 1);

      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderIndex: 5,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks from accessible organizations', async () => {
      organizationsService.getAccessibleOrgs.mockResolvedValue([
        mockOrganization as any,
      ]);
      taskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.findAll(Role.OWNER, 1);

      expect(organizationsService.getAccessibleOrgs).toHaveBeenCalledWith(
        Role.OWNER,
        1,
      );
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: [{ organizationId: 1 }],
        relations: ['owner', 'organization'],
        order: { orderIndex: 'ASC' },
      });
      expect(result).toEqual([mockTask]);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(1);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['owner', 'organization'],
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Task with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a task and log changes', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
        status: TaskStatus.IN_PROGRESS,
      };

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue({
        ...mockTask,
        ...updateDto,
      });

      const result = await service.update(1, updateDto, 1);

      expect(taskRepository.save).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        1,
        'task.update',
        'Task',
        1,
        expect.objectContaining({
          changes: expect.objectContaining({
            title: { from: 'Test Task', to: 'Updated Title' },
            status: { from: TaskStatus.TODO, to: TaskStatus.IN_PROGRESS },
          }),
        }),
      );
      expect(result.title).toBe('Updated Title');
    });

    it('should not log audit if no changes made', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      await service.update(1, {}, 1);

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a task and log audit', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.remove.mockResolvedValue(mockTask);

      await service.remove(1, 1);

      expect(auditService.record).toHaveBeenCalledWith(
        1,
        'task.delete',
        'Task',
        1,
        { title: mockTask.title, status: mockTask.status },
      );
      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('should reorder task within same status', async () => {
      const reorderDto: ReorderTaskDto = {
        newOrderIndex: 2,
      };

      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      taskRepository.findOne.mockResolvedValue(mockTask);
      organizationsService.checkOrgAccess.mockResolvedValue(true);
      taskRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      taskRepository.save.mockResolvedValue({
        ...mockTask,
        orderIndex: 2,
      });

      const result = await service.reorder(1, reorderDto, Role.OWNER, 1);

      expect(organizationsService.checkOrgAccess).toHaveBeenCalledWith(
        Role.OWNER,
        1,
        1,
      );
      expect(result.orderIndex).toBe(2);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const reorderDto: ReorderTaskDto = {
        newOrderIndex: 2,
      };

      taskRepository.findOne.mockResolvedValue(mockTask);
      organizationsService.checkOrgAccess.mockResolvedValue(false);

      await expect(
        service.reorder(1, reorderDto, Role.VIEWER, 2),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.reorder(1, reorderDto, Role.VIEWER, 2),
      ).rejects.toThrow(
        'You do not have permission to reorder this task',
      );
    });

    it('should handle status change during reorder', async () => {
      const reorderDto: ReorderTaskDto = {
        newOrderIndex: 1,
        newStatus: TaskStatus.IN_PROGRESS,
      };

      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      taskRepository.findOne.mockResolvedValue(mockTask);
      organizationsService.checkOrgAccess.mockResolvedValue(true);
      taskRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      taskRepository.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
        orderIndex: 1,
      });

      const result = await service.reorder(1, reorderDto, Role.OWNER, 1);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.orderIndex).toBe(1);
    });
  });

  describe('checkTaskAccess', () => {
    it('should return true if user has access to task', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      organizationsService.checkOrgAccess.mockResolvedValue(true);

      const result = await service.checkTaskAccess(1, Role.OWNER, 1);

      expect(result).toBe(true);
      expect(organizationsService.checkOrgAccess).toHaveBeenCalledWith(
        Role.OWNER,
        1,
        1,
      );
    });

    it('should return false if user has no access to task', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      organizationsService.checkOrgAccess.mockResolvedValue(false);

      const result = await service.checkTaskAccess(1, Role.VIEWER, 2);

      expect(result).toBe(false);
    });
  });

  describe('findByOrganization', () => {
    it('should return tasks for specific organization', async () => {
      taskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.findByOrganization(1);

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        relations: ['owner', 'organization'],
        order: { orderIndex: 'ASC' },
      });
      expect(result).toEqual([mockTask]);
    });
  });
});
