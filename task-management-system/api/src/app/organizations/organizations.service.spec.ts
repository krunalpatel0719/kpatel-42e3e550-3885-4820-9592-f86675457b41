import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from '../database/entities/organization.entity';
import { Role } from '@task-management-system/auth';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: jest.Mocked<Repository<Organization>>;

  const mockOrg: Organization = {
    id: 1,
    name: 'Test Org',
    parent: null,
    children: [],
    users: [],
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repository = module.get(getRepositoryToken(Organization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create organization without parent', async () => {
      const dto = { name: 'New Org', parentId: null };
      repository.create.mockReturnValue(mockOrg);
      repository.save.mockResolvedValue(mockOrg);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockOrg);
    });

    it('should throw error if parent has a parent (3-level hierarchy)', async () => {
      const dto = { name: 'Child Org', parentId: 2 };
      const parentWithGrandparent = {
        ...mockOrg,
        id: 2,
        parent: { id: 1 } as Organization,
      };
      repository.findOne.mockResolvedValue(parentWithGrandparent as any);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if parent not found', async () => {
      const dto = { name: 'Child Org', parentId: 999 };
      repository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all organizations with relations', async () => {
      repository.find.mockResolvedValue([mockOrg]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['parent', 'children'],
      });
      expect(result).toEqual([mockOrg]);
    });
  });

  describe('findOne', () => {
    it('should return organization by id', async () => {
      repository.findOne.mockResolvedValue(mockOrg);

      const result = await service.findOne(1);

      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update organization name', async () => {
      const dto = { name: 'Updated Name' };
      repository.findOne.mockResolvedValue(mockOrg);
      repository.save.mockResolvedValue({ ...mockOrg, name: 'Updated Name' });

      const result = await service.update(1, dto);

      expect(repository.save).toHaveBeenCalled();
    });

    it('should prevent circular reference', async () => {
      const dto = { parentId: 1 };
      const selfOrg = { ...mockOrg, id: 1 };
      repository.findOne
        .mockResolvedValueOnce(selfOrg)
        .mockResolvedValueOnce(selfOrg);

      await expect(service.update(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('isDirectChild', () => {
    it('should return true if child belongs to parent', async () => {
      const child = { ...mockOrg, id: 2, parent: { id: 1 } as Organization };
      repository.findOne.mockResolvedValue(child as any);

      const result = await service.isDirectChild(1, 2);

      expect(result).toBe(true);
    });

    it('should return false if not a direct child', async () => {
      repository.findOne.mockResolvedValue(mockOrg);

      const result = await service.isDirectChild(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getAccessibleOrgs', () => {
    it('should return all orgs for Owner', async () => {
      repository.find.mockResolvedValue([mockOrg]);

      const result = await service.getAccessibleOrgs(Role.OWNER, 1);

      expect(result).toEqual([mockOrg]);
    });

    it('should return own org + children for Admin', async () => {
      const orgWithChildren = { ...mockOrg, children: [mockOrg] };
      repository.findOne.mockResolvedValue(orgWithChildren as any);

      const result = await service.getAccessibleOrgs(Role.ADMIN, 1);

      expect(result).toHaveLength(2);
    });

    it('should return only own org for Viewer', async () => {
      repository.findOne.mockResolvedValue(mockOrg);

      const result = await service.getAccessibleOrgs(Role.VIEWER, 1);

      expect(result).toEqual([mockOrg]);
    });
  });
});
