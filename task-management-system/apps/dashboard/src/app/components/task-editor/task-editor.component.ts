import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ITask, TaskStatus, CreateTaskDto, UpdateTaskDto } from '../../services/tasks.service';

@Component({
  selector: 'app-task-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-editor.component.html',
  styleUrls: ['./task-editor.component.css'],
})
export class TaskEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() task?: ITask;
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTaskDto | { id: number; dto: UpdateTaskDto }>();

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: [''],
    status: [TaskStatus.TODO as TaskStatus],
  });

  statuses = [
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.DONE, label: 'Done' },
  ];

  categories = ['Work', 'Personal'];

  ngOnInit(): void {
    if (this.task) {
      this.form.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        category: this.task.category || '',
        status: this.task.status,
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const dto = {
      title: formValue.title!,
      description: formValue.description || undefined,
      category: formValue.category || undefined,
      status: formValue.status as TaskStatus,
    };

    if (this.task) {
      // Edit existing task
      this.save.emit({ id: this.task.id, dto });
    } else {
      // Create new task
      this.save.emit(dto as CreateTaskDto);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  get isEditMode(): boolean {
    return !!this.task;
  }
}
