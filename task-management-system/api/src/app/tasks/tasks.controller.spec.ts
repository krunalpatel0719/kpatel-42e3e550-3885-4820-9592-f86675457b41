import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { Task, TaskStatus } from '../database/entities/task.entity';
import { Role } from '@task-management-system/auth';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: jest.Mocked<TasksService>;

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

  const mockRequest = {
    user: {
      id: 1,
      email: 'test@example.com',
      role: Role.OWNER,
      organizationId: 1,
    },
  };

  beforeEach(async () => {
    const mockTasksService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByOrganization: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      reorder: jest.fn(),
      checkTaskAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const createDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        category: 'Work',
        status: TaskStatus.TODO,
      };

      tasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createDto, mockRequest);

      expect(tasksService.create).toHaveBeenCalledWith(
        createDto,
        mockRequest.user.id,
        mockRequest.user.organizationId,
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks accessible to user', async () => {
      tasksService.findAll.mockResolvedValue([mockTask]);

      const result = await controller.findAll(mockRequest);

      expect(tasksService.findAll).toHaveBeenCalledWith(
        mockRequest.user.role,
        mockRequest.user.organizationId,
      );
      expect(result).toEqual([mockTask]);
    });

    it('should return empty array if no tasks', async () => {
      tasksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([]);
    });
  });

  describe('GET /tasks/organization/:orgId', () => {
    it('should return tasks for specific organization if user has access', async () => {
      tasksService.checkTaskAccess.mockResolvedValue(true);
      tasksService.findByOrganization.mockResolvedValue([mockTask]);

      const result = await controller.findByOrganization('1', mockRequest);

      expect(tasksService.checkTaskAccess).toHaveBeenCalledWith(
        1,
        mockRequest.user.role,
        mockRequest.user.organizationId,
      );
      expect(tasksService.findByOrganization).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockTask]);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      tasksService.checkTaskAccess.mockResolvedValue(false);

      await expect(
        controller.findByOrganization('2', mockRequest),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.findByOrganization('2', mockRequest),
      ).rejects.toThrow(
        'You do not have permission to view tasks from this organization',
      );
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a specific task if user has access', async () => {
      tasksService.checkTaskAccess.mockResolvedValue(true);
      tasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('1', mockRequest);

      expect(tasksService.checkTaskAccess).toHaveBeenCalledWith(
        1,
        mockRequest.user.role,
        mockRequest.user.organizationId,
      );
      expect(tasksService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      tasksService.checkTaskAccess.mockResolvedValue(false);

      await expect(controller.findOne('1', mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.findOne('1', mockRequest)).rejects.toThrow(
        'You do not have permission to view this task',
      );
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update a task if user has access', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
      };

      tasksService.checkTaskAccess.mockResolvedValue(true);
      tasksService.update.mockResolvedValue({
        ...mockTask,
        ...updateDto,
      });

      const result = await controller.update('1', updateDto, mockRequest);

      expect(tasksService.checkTaskAccess).toHaveBeenCalledWith(
        1,
        mockRequest.user.role,
        mockRequest.user.organizationId,
      );
      expect(tasksService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockRequest.user.id,
      );
      expect(result.title).toBe('Updated Task');
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Task',
      };

      tasksService.checkTaskAccess.mockResolvedValue(false);

      await expect(
        controller.update('1', updateDto, mockRequest),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.update('1', updateDto, mockRequest),
      ).rejects.toThrow('You do not have permission to update this task');
    });
  });

  describe('PATCH /tasks/:id/reorder', () => {
    it('should reorder a task', async () => {
      const reorderDto: ReorderTaskDto = {
        newOrderIndex: 2,
      };

      tasksService.reorder.mockResolvedValue({
        ...mockTask,
        orderIndex: 2,
      });

      const result = await controller.reorder('1', reorderDto, mockRequest);

      expect(tasksService.reorder).toHaveBeenCalledWith(
        1,
        reorderDto,
        mockRequest.user.role,
        mockRequest.user.organizationId,
      );
      expect(result.orderIndex).toBe(2);
    });

    it('should reorder task with status change', async () => {
      const reorderDto: ReorderTaskDto = {
        newOrderIndex: 1,
        newStatus: TaskStatus.IN_PROGRESS,
      };

      tasksService.reorder.mockResolvedValue({
        ...mockTask,
        orderIndex: 1,
        status: TaskStatus.IN_PROGRESS,
      });

      const result = await controller.reorder('1', reorderDto, mockRequest);

      expect(result.orderIndex).toBe(1);
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task if user has access', async () => {
      tasksService.checkTaskAccess.mockResolvedValue(true);
      tasksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1', mockRequest);

      expect(tasksService.checkTaskAccess).toHaveBeenCalledWith(
        1,
        mockRequest.user.role,
        mockRequest.user.organizationId,
      );
      expect(tasksService.remove).toHaveBeenCalledWith(1, mockRequest.user.id);
      expect(result).toEqual({ message: 'Task deleted successfully' });
    });

    it('should throw ForbiddenException if user has no access', async () => {
      tasksService.checkTaskAccess.mockResolvedValue(false);

      await expect(controller.remove('1', mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.remove('1', mockRequest)).rejects.toThrow(
        'You do not have permission to delete this task',
      );
    });
  });
});
