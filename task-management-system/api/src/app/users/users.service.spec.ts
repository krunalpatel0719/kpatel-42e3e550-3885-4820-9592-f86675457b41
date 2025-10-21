import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserRole } from '../database/entities/user.entity';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: UserRole.ADMIN,
    organizationId: 1,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
        role: UserRole.VIEWER,
        organizationId: 1,
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockUser as any);
      repository.save.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.createUser(dto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto = {
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.VIEWER,
        organizationId: 1,
      };

      repository.findOne.mockResolvedValue(mockUser as any);

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with organization relation', async () => {
      repository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['organization'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id with organization relation', async () => {
      repository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findById(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['organization'],
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(mockUser as any, 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(mockUser as any, 'wrongpassword');

      expect(result).toBe(false);
    });
  });
});
