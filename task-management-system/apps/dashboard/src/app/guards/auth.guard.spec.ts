import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    authService = {
      isAuthenticated: jest.fn(),
    } as any;

    router = {
      createUrlTree: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should allow authenticated users', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/home' } as any)
    );

    expect(result).toBe(true);
  });

  it('should redirect unauthenticated users to login', () => {
    authService.isAuthenticated.mockReturnValue(false);
    const mockUrlTree = {} as any;
    router.createUrlTree.mockReturnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/home' } as any)
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/home' },
    });
    expect(result).toBe(mockUrlTree);
  });
});
