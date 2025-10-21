import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: UserRole.OWNER,
    organizationId: 1,
    organization: null as any,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 1,
    email: 'test@example.com',
    role: UserRole.OWNER,
    organizationId: 1,
    organization: null as any,
    tasks: [],
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    const mockUsersService = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user with default VIEWER role', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        organizationId: 1,
      };

      usersService.createUser.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock_token');

      const result = await service.register(registerDto);

      expect(usersService.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        role: UserRole.VIEWER,
        organizationId: registerDto.organizationId,
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });

      expect(result).toEqual({
        accessToken: 'mock_token',
        user: mockUserWithoutPassword,
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should register a new user with specified role', async () => {
      const registerDto: RegisterDto = {
        email: 'admin@example.com',
        password: 'password123',
        organizationId: 1,
        role: UserRole.ADMIN,
      };

      usersService.createUser.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        role: UserRole.ADMIN,
      });
      jwtService.sign.mockReturnValue('mock_token');

      await service.register(registerDto);

      expect(usersService.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        role: UserRole.ADMIN,
        organizationId: registerDto.organizationId,
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock_token');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(usersService.validatePassword).toHaveBeenCalledWith(
        mockUser,
        loginDto.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });

      expect(result).toEqual({
        accessToken: 'mock_token',
        user: mockUserWithoutPassword,
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });
});
