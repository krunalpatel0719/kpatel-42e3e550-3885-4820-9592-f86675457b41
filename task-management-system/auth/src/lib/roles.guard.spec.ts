import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from './roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any);

  it('should allow access if no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const context = createMockContext({ role: Role.VIEWER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.OWNER]);
    const context = createMockContext({ role: Role.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ role: Role.VIEWER });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if user is not authenticated', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext(null);

    expect(guard.canActivate(context)).toBe(false);
  });
});
