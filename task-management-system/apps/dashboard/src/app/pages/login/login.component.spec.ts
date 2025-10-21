import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;
  let activatedRoute: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'owner',
    organizationId: 1,
  };

  const mockLoginResponse = {
    accessToken: 'mock_token',
    user: mockUser,
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
    };

    const mockRouter = {
      navigate: jest.fn(),
    };

    const mockActivatedRoute = {
      snapshot: {
        queryParams: {},
      },
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    jest.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with empty form', () => {
      expect(component.loginForm.value).toEqual({
        email: '',
        password: '',
      });
    });

    it('should have email and password controls', () => {
      expect(component.loginForm.get('email')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
    });

    it('should mark email as invalid if empty', () => {
      const emailControl = component.loginForm.get('email');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should mark email as invalid if not valid email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('notanemail');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should mark password as invalid if less than 6 characters', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12345');
      expect(passwordControl?.valid).toBe(false);
      expect(passwordControl?.hasError('minlength')).toBe(true);
    });

    it('should be valid with correct email and password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should not call authService.login if form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: '',
      });

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should call authService.login with credentials if form is valid', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      component.loginForm.patchValue(credentials);
      authService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith(credentials);
    });

    it('should set isLoading to true during login', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      authService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(true);
    });

    it('should navigate to root on successful login', (done) => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      authService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        done();
      }, 100);
    });

    it('should navigate to returnUrl if provided', (done) => {
      activatedRoute.snapshot.queryParams['returnUrl'] = '/dashboard';

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      authService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      }, 100);
    });

    it('should set errorMessage on login failure', (done) => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      const errorResponse = {
        error: { message: 'Invalid email or password' },
      };

      authService.login.mockReturnValue(throwError(() => errorResponse));

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage).toBe('Invalid email or password');
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });

    it('should use default error message if none provided', (done) => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      authService.login.mockReturnValue(throwError(() => ({})));

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage).toBe('Invalid email or password');
        done();
      }, 100);
    });

    it('should clear errorMessage before login attempt', () => {
      component.errorMessage = 'Previous error';
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      authService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.errorMessage).toBe('');
    });
  });

  describe('Template', () => {
    it('should disable submit button when form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: '',
      });
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.disabled).toBe(true);
    });

    it('should disable submit button when isLoading is true', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      component.isLoading = true;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.disabled).toBe(true);
    });

    it('should show error message when errorMessage is set', () => {
      component.errorMessage = 'Test error message';
      fixture.detectChanges();

      const errorDiv = fixture.nativeElement.querySelector('.bg-red-50');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.textContent).toContain('Test error message');
    });

    it('should not show error message when errorMessage is empty', () => {
      component.errorMessage = '';
      fixture.detectChanges();

      const errorDiv = fixture.nativeElement.querySelector('.bg-red-50');
      expect(errorDiv).toBeFalsy();
    });

    it('should show "Sign in" text when not loading', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.textContent).toContain('Sign in');
    });

    it('should show "Signing in..." text when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.textContent).toContain('Signing in...');
    });
  });
});
