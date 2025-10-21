import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TaskEditorComponent } from './task-editor.component';

describe('TaskEditorComponent', () => {
  let component: TaskEditorComponent;
  let fixture: ComponentFixture<TaskEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskEditorComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form for new task', () => {
    expect(component.form.get('title')).toBeTruthy();
    expect(component.form.get('description')).toBeTruthy();
    expect(component.form.get('category')).toBeTruthy();
    expect(component.form.get('status')).toBeTruthy();
  });

  it('should populate form when editing existing task', () => {
    const task = {
      id: 1,
      title: 'Existing Task',
      description: 'Test',
      category: 'Work',
      status: 'todo' as any,
      orderIndex: 0,
      ownerId: 1,
      organizationId: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    component.task = task;
    component.ngOnInit();

    expect(component.form.get('title')?.value).toBe('Existing Task');
  });

  it('should emit save event with form values', () => {
    const saveSpy = jest.spyOn(component.save, 'emit');
    component.form.patchValue({
      title: 'New Task',
      description: 'Description',
      category: 'Work',
      status: 'todo' as any,
    });

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalled();
  });
});
