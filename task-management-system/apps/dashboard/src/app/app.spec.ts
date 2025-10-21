import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { of } from 'rxjs';

describe('App', () => {
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'owner',
    organizationId: 1,
  };

  beforeEach(async () => {
    const mockAuthService = {
      getCurrentUser: jest.fn(),
      logout: jest.fn(),
      isAuthenticated$: of(true),
    };

    await TestBed.configureTestingModule({
      imports: [App, RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title "dashboard"', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['title']).toBe('dashboard');
  });

  it('should get current user from AuthService', () => {
    authService.getCurrentUser.mockReturnValue(mockUser);

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.currentUser).toEqual(mockUser);
    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('should call authService.logout when logout is called', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.logout();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should render router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
