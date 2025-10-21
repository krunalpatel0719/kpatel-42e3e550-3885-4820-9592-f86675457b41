import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../../database/entities/task.entity';

export class ReorderTaskDto {
  @IsNumber()
  newOrderIndex: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  newStatus?: TaskStatus;
}
