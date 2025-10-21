import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { Role } from '@task-management-system/auth';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_password_123',
    role: Role.ADMIN,
    organizationId: 1,
    organization: null,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      validatePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate and return user without password hash', async () => {
      const payload: JwtPayload = { sub: 1, email: 'test@example.com' };
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await strategy.validate(payload);

      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(usersService.findById).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload: JwtPayload = { sub: 999, email: 'notfound@example.com' };
      usersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(payload)).rejects.toThrow('User not found');
      expect(usersService.findById).toHaveBeenCalledWith(999);
    });

    it('should throw UnauthorizedException when user is undefined', async () => {
      const payload: JwtPayload = { sub: 999, email: 'undefined@example.com' };
      usersService.findById.mockResolvedValue(undefined);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );
      expect(usersService.findById).toHaveBeenCalledWith(999);
    });

    it('should handle different user roles correctly', async () => {
      const ownerUser = { ...mockUser, role: Role.OWNER };
      usersService.findById.mockResolvedValue(ownerUser as any);
      const payload: JwtPayload = { sub: 1, email: 'owner@example.com' };

      const result = await strategy.validate(payload);

      expect(result.role).toBe(Role.OWNER);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should handle viewer role correctly', async () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER };
      usersService.findById.mockResolvedValue(viewerUser as any);
      const payload: JwtPayload = { sub: 2, email: 'viewer@example.com' };

      const result = await strategy.validate(payload);

      expect(result.role).toBe(Role.VIEWER);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should handle different organization IDs', async () => {
      const userOrg5 = { ...mockUser, organizationId: 5 };
      usersService.findById.mockResolvedValue(userOrg5 as any);
      const payload: JwtPayload = { sub: 1, email: 'test@example.com' };

      const result = await strategy.validate(payload);

      expect(result.organizationId).toBe(5);
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should be an instance of JwtStrategy', () => {
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });
  });
});
