import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { OrganizationsService } from '../../services/organizations.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jest.Mocked<AuthService>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let router: jest.Mocked<Router>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
    };

    const mockOrganizationsService = {
      getOrganizations: jest.fn().mockReturnValue(of([{ id: 1, name: 'Test Org' }])),
    };

    const mockRouter = {
      navigate: jest.fn(),
      createUrlTree: jest.fn(),
      serializeUrl: jest.fn().mockReturnValue(''),
      events: new Subject(),
    };

    const mockActivatedRoute = {
      snapshot: { queryParams: {} },
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as any;
    organizationsService = TestBed.inject(OrganizationsService) as any;
    router = TestBed.inject(Router) as any;

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    expect(component.form.get('email')).toBeTruthy();
    expect(component.form.get('password')).toBeTruthy();
    expect(component.form.get('organizationId')).toBeTruthy();
  });

  it('should call authService.register on valid submission', async () => {
    authService.register.mockReturnValue(of({} as any));
    component.form.patchValue({
      email: 'test@example.com',
      password: 'password123',
      organizationId: 1,
    });

    await component.onSubmit();

    expect(authService.register).toHaveBeenCalled();
  });

  it('should handle registration error', async () => {
    authService.register.mockReturnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.form.patchValue({
      email: 'test@example.com',
      password: 'password123',
      organizationId: 1,
    });

    await component.onSubmit();

    expect(component.errorMessage).toBeTruthy();
  });
});
