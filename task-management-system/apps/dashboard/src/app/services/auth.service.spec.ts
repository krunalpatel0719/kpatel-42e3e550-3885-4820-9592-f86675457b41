import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, LoginCredentials } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jest.Mocked<Router>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'owner',
    organizationId: 1,
  };

  const mockLoginResponse = {
    accessToken: 'mock_jwt_token',
    user: mockUser,
  };

  beforeEach(() => {
    const mockRouter = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jest.Mocked<Router>;

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token and user', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('access_token')).toBe('mock_jwt_token');
        expect(localStorage.getItem('current_user')).toBe(
          JSON.stringify(mockUser)
        );
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockLoginResponse);
    });

    it('should emit authentication state change on login', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      let emittedStates: boolean[] = [];
      const sub = service.isAuthenticated$.subscribe((state) => {
        emittedStates.push(state);
      });

      service.login(credentials).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockLoginResponse);

      expect(emittedStates).toContain(true);
      sub.unsubscribe();
    });

    it('should handle login error', () => {
      const credentials: LoginCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(localStorage.getItem('access_token')).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear token and user data', () => {
      localStorage.setItem('access_token', 'mock_token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should emit authentication state change on logout', () => {
      localStorage.setItem('access_token', 'mock_token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      let emittedStates: boolean[] = [];
      const sub = service.isAuthenticated$.subscribe((state) => {
        emittedStates.push(state);
      });

      service.logout();

      expect(emittedStates).toContain(false);
      sub.unsubscribe();
    });
  });

  describe('getToken', () => {
    it('should return token if exists', () => {
      localStorage.setItem('access_token', 'mock_token');

      expect(service.getToken()).toBe('mock_token');
    });

    it('should return null if token does not exist', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user if exists', () => {
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null if user does not exist', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('current_user', 'invalid-json');

      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('access_token', 'mock_token');

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false if token does not exist', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated$', () => {
    it('should emit true when authenticated', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      let emittedStates: boolean[] = [];
      const sub = service.isAuthenticated$.subscribe((state) => {
        emittedStates.push(state);
      });

      service.login(credentials).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockLoginResponse);

      expect(emittedStates).toContain(true);
      sub.unsubscribe();
    });

    it('should emit false when not authenticated', () => {
      localStorage.setItem('access_token', 'mock_token');

      let emittedStates: boolean[] = [];
      const sub = service.isAuthenticated$.subscribe((state) => {
        emittedStates.push(state);
      });

      service.logout();

      expect(emittedStates).toContain(false);
      sub.unsubscribe();
    });
  });

  describe('register', () => {
    it('should register successfully and store token and user', () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        organizationId: 1,
      };

      service.register(registerData).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('access_token')).toBe('mock_jwt_token');
        expect(localStorage.getItem('current_user')).toBe(
          JSON.stringify(mockUser)
        );
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(mockLoginResponse);
    });
  });
});
