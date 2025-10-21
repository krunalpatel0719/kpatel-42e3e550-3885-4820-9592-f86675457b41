import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { TasksService } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const mockTasksService = {
      list: jest.fn().mockReturnValue(of([])),
      tasks$: of([]),
    };

    const mockAuthService = {
      getCurrentUser: jest.fn().mockReturnValue({ role: 'Admin' }),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    const tasksService = TestBed.inject(TasksService) as any;
    expect(tasksService.list).toHaveBeenCalled();
  });
});
