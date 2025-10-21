import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  beforeEach(async () => {
    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    component.task = {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as any,
      orderIndex: 0,
      ownerId: 1,
      organizationId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    component.canEdit = true;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display task title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Test Task');
  });

  it('should emit edit event when edit button clicked', () => {
    const editSpy = jest.spyOn(component.edit, 'emit');
    component.onEdit();
    expect(editSpy).toHaveBeenCalledWith(component.task);
  });

  it('should emit delete event when delete button clicked and confirmed', () => {
    const deleteSpy = jest.spyOn(component.delete, 'emit');
    (global.confirm as jest.Mock).mockReturnValueOnce(true);

    component.onDelete();

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith(component.task.id);
  });

  it('should not emit delete event when delete is cancelled', () => {
    const deleteSpy = jest.spyOn(component.delete, 'emit');
    (global.confirm as jest.Mock).mockReturnValueOnce(false);

    component.onDelete();

    expect(global.confirm).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
