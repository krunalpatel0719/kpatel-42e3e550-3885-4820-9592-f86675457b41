export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTaskDto {
  title: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
  orderIndex?: number;
}

export interface IUpdateTaskDto {
  title?: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
  orderIndex?: number;
}

export interface IReorderTaskDto {
  taskId: number;
  newOrderIndex: number;
  newStatus?: TaskStatus;
}
