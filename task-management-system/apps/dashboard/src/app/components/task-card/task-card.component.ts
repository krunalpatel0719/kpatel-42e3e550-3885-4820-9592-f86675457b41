import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask } from '../../services/tasks.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css'],
})
export class TaskCardComponent {
  @Input() task!: ITask;
  @Input() canEdit = false;

  @Output() edit = new EventEmitter<ITask>();
  @Output() delete = new EventEmitter<number>();

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete "${this.task.title}"?`)) {
      this.delete.emit(this.task.id);
    }
  }

  getCategoryColor(category?: string): string {
    if (!category) return 'bg-gray-100 text-gray-800';
    return category === 'Work'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
  }
}
