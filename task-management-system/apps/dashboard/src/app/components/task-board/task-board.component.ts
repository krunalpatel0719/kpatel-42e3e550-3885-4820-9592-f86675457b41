import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TasksService, ITask, TaskStatus, CreateTaskDto, UpdateTaskDto } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskEditorComponent } from '../task-editor/task-editor.component';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskCardComponent, TaskEditorComponent],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.css'],
})
export class TaskBoardComponent implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly authService = inject(AuthService);

  todoTasks: ITask[] = [];
  inProgressTasks: ITask[] = [];
  doneTasks: ITask[] = [];

  searchQuery = '';
  categoryFilter = '';
  categories: string[] = [];

  isEditorOpen = false;
  editingTask?: ITask;
  isLoading = true;
  isSaving = false;
  errorMessage = '';

  canEdit = false;
  currentUserRole = '';

  // Expose TaskStatus enum for template
  readonly TaskStatus = TaskStatus;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserRole = user?.role || '';
    this.canEdit = this.currentUserRole === 'Owner' || this.currentUserRole === 'Admin';

    this.loadTasks();

    this.tasksService.tasks$.subscribe((tasks) => {
      this.updateTaskColumns(tasks);
    });
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.tasksService.list().subscribe({
      next: (tasks) => {
        this.updateTaskColumns(tasks);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.errorMessage = 'Failed to load tasks. Please try again.';
        this.isLoading = false;
      },
    });
  }

  updateTaskColumns(tasks: ITask[]): void {
    let filteredTasks = tasks;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    if (this.categoryFilter) {
      filteredTasks = filteredTasks.filter((t) => t.category === this.categoryFilter);
    }

    this.todoTasks = filteredTasks
      .filter((t) => t.status === TaskStatus.TODO)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    this.inProgressTasks = filteredTasks
      .filter((t) => t.status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    this.doneTasks = filteredTasks
      .filter((t) => t.status === TaskStatus.DONE)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    this.categories = [...new Set(tasks.map((t) => t.category).filter((c) => !!c) as string[])];
  }

  onDrop(event: CdkDragDrop<ITask[]>, newStatus: TaskStatus): void {
    if (!this.canEdit || this.isSaving) return;

    const task = event.item.data as ITask;
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Don't do anything if dropped in same position
    if (event.previousContainer === event.container && previousIndex === currentIndex) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(event.container.data, previousIndex, currentIndex);

      const newOrderIndex = currentIndex;

      this.tasksService.reorder(task.id, { newOrderIndex }).subscribe({
        next: () => {
          this.isSaving = false;
          // Reload to ensure consistency
          this.loadTasks();
        },
        error: (err) => {
          console.error('Reorder failed:', err);
          this.errorMessage = 'Failed to reorder task. Reloading...';
          this.isSaving = false;
          // Reload from server to get correct state
          this.loadTasks();
        },
      });
    } else {
      // Move across columns
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        previousIndex,
        currentIndex
      );

      const newOrderIndex = currentIndex;

      this.tasksService.reorder(task.id, { newOrderIndex, newStatus }).subscribe({
        next: () => {
          this.isSaving = false;
          // Reload to ensure consistency
          this.loadTasks();
        },
        error: (err) => {
          console.error('Move failed:', err);
          this.errorMessage = 'Failed to move task. Reloading...';
          this.isSaving = false;
          // Reload from server to get correct state
          this.loadTasks();
        },
      });
    }
  }

  openCreateDialog(): void {
    this.editingTask = undefined;
    this.isEditorOpen = true;
  }

  openEditDialog(task: ITask): void {
    this.editingTask = task;
    this.isEditorOpen = true;
  }

  closeEditor(): void {
    this.isEditorOpen = false;
    this.editingTask = undefined;
  }

  onSaveTask(data: CreateTaskDto | { id: number; dto: UpdateTaskDto }): void {
    if (this.isSaving) return;

    this.isSaving = true;
    this.errorMessage = '';

    if ('id' in data) {
      this.tasksService.update(data.id, data.dto).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeEditor();
          // Reload to ensure UI is in sync
          this.loadTasks();
        },
        error: (err) => {
          console.error('Update failed:', err);
          this.errorMessage = 'Failed to update task. Please try again.';
          this.isSaving = false;
        },
      });
    } else {
      this.tasksService.create(data).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeEditor();
          // Reload to ensure UI is in sync
          this.loadTasks();
        },
        error: (err) => {
          console.error('Create failed:', err);
          this.errorMessage = 'Failed to create task. Please try again.';
          this.isSaving = false;
        },
      });
    }
  }

  onDeleteTask(id: number): void {
    if (this.isSaving) return;

    this.isSaving = true;
    this.errorMessage = '';

    this.tasksService.remove(id).subscribe({
      next: () => {
        this.isSaving = false;
        // State is already updated by the service, just reload to be sure
        this.loadTasks();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.errorMessage = 'Failed to delete task. Please try again.';
        this.isSaving = false;
        // Reload to restore correct state
        this.loadTasks();
      },
    });
  }

  onSearchChange(): void {
    const allTasks = this.tasksService.getCurrentTasks();
    this.updateTaskColumns(allTasks);
  }

  onCategoryFilterChange(): void {
    const allTasks = this.tasksService.getCurrentTasks();
    this.updateTaskColumns(allTasks);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.categoryFilter = '';
    const allTasks = this.tasksService.getCurrentTasks();
    this.updateTaskColumns(allTasks);
  }
}
