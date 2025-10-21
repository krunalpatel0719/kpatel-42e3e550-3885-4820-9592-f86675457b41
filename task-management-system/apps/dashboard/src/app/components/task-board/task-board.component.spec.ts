import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskBoardComponent } from './task-board.component';
import { TasksService } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('TaskBoardComponent', () => {
  let component: TaskBoardComponent;
  let fixture: ComponentFixture<TaskBoardComponent>;

  beforeEach(async () => {
    const mockTasksService = {
      tasks$: of([]),
      list: jest.fn().mockReturnValue(of([])),
      reorder: jest.fn().mockReturnValue(of({})),
    };

    const mockAuthService = {
      getCurrentUser: jest.fn().mockReturnValue({ role: 'Admin' }),
      isAuthenticated: jest.fn().mockReturnValue(true),
    };

    const mockRouter = {
      navigate: jest.fn(),
      createUrlTree: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TasksService, useValue: mockTasksService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;
    component.canEdit = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter tasks by status', () => {
    const tasks = [
      { id: 1, status: 'todo' as any, title: 'Test', orderIndex: 0 } as any,
      { id: 2, status: 'done' as any, title: 'Test 2', orderIndex: 0 } as any,
    ];
    component.updateTaskColumns(tasks);

    expect(component.todoTasks).toHaveLength(1);
    expect(component.todoTasks[0].status).toBe('todo');
    expect(component.doneTasks).toHaveLength(1);
    expect(component.doneTasks[0].status).toBe('done');
  });
});
