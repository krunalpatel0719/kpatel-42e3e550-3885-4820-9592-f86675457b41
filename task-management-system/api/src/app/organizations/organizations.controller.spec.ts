import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { Role } from '@task-management-system/auth';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: jest.Mocked<OrganizationsService>;

  const mockOrg = { id: 1, name: 'Test Org', parent: null, children: [] };
  const mockRequest = { user: { id: 1, role: Role.ADMIN, organizationId: 1 } };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      checkOrgAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [{ provide: OrganizationsService, useValue: mockService }],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    service = module.get(OrganizationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create organization', async () => {
      const dto = { name: 'New Org', parentId: null };
      service.create.mockResolvedValue(mockOrg as any);

      const result = await controller.create(dto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockOrg);
    });

    it('should throw ForbiddenException if no access to parent', async () => {
      const dto = { name: 'New Org', parentId: 2 };
      service.checkOrgAccess.mockResolvedValue(false);

      await expect(controller.create(dto, mockRequest)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findAll', () => {
    it('should return all organizations', async () => {
      service.findAll.mockResolvedValue([mockOrg] as any);

      const result = await controller.findAll();

      expect(result).toEqual([mockOrg]);
    });
  });

  describe('findOne', () => {
    it('should return organization by id if access granted', async () => {
      service.checkOrgAccess.mockResolvedValue(true);
      service.findOne.mockResolvedValue(mockOrg as any);

      const result = await controller.findOne('1', mockRequest);

      expect(result).toEqual(mockOrg);
    });

    it('should throw ForbiddenException if no access', async () => {
      service.checkOrgAccess.mockResolvedValue(false);

      await expect(controller.findOne('1', mockRequest)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
