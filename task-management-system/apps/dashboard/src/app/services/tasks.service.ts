import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

export enum TaskCategory {
  WORK = 'Work',
  PERSONAL = 'Personal',
}

export interface ITask {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status: TaskStatus;
  orderIndex: number;
  ownerId: number;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
  orderIndex?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
}

export interface ReorderTaskDto {
  newOrderIndex: number;
  newStatus?: TaskStatus;
}

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';

  private tasksSubject = new BehaviorSubject<ITask[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  list(): Observable<ITask[]> {
    return this.http.get<ITask[]>(`${this.apiUrl}/tasks`).pipe(
      tap((tasks) => this.tasksSubject.next(tasks))
    );
  }

  create(dto: CreateTaskDto): Observable<ITask> {
    return this.http.post<ITask>(`${this.apiUrl}/tasks`, dto).pipe(
      tap((task) => {
        const current = this.tasksSubject.value;
        this.tasksSubject.next([...current, task]);
      })
    );
  }

  update(id: number, dto: UpdateTaskDto): Observable<ITask> {
    return this.http.put<ITask>(`${this.apiUrl}/tasks/${id}`, dto).pipe(
      tap((updatedTask) => {
        const current = this.tasksSubject.value;
        const index = current.findIndex((t) => t.id === id);
        if (index !== -1) {
          current[index] = updatedTask;
          this.tasksSubject.next([...current]);
        }
      })
    );
  }

  reorder(id: number, dto: ReorderTaskDto): Observable<ITask> {
    return this.http.patch<ITask>(`${this.apiUrl}/tasks/${id}/reorder`, dto).pipe(
      tap((updatedTask) => {
        const current = this.tasksSubject.value;
        const index = current.findIndex((t) => t.id === id);
        if (index !== -1) {
          current[index] = updatedTask;
          this.tasksSubject.next([...current]);
        }
      })
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`).pipe(
      tap(() => {
        const current = this.tasksSubject.value;
        this.tasksSubject.next(current.filter((t) => t.id !== id));
      })
    );
  }


  // Get current tasks snapshot
  getCurrentTasks(): ITask[] {
    return this.tasksSubject.value;
  }
}
