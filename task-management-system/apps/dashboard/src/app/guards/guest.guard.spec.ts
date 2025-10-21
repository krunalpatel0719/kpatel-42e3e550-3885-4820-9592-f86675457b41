import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('guestGuard', () => {
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

  it('should allow guests (unauthenticated users)', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, { url: '/login' } as any)
    );

    expect(result).toBe(true);
  });

  it('should redirect authenticated users to home', () => {
    authService.isAuthenticated.mockReturnValue(true);
    const mockUrlTree = {} as any;
    router.createUrlTree.mockReturnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, { url: '/login' } as any)
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(mockUrlTree);
  });
});
