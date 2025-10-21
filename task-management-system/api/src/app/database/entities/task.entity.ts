import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

export enum TaskCategory {
  WORK = 'Work',
  PERSONAL = 'Personal',
}

@Entity('tasks')
@Index(['organizationId', 'orderIndex'])
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @Column({
    type: 'varchar',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ type: 'integer', default: 0 })
  orderIndex: number;

  @ManyToOne(() => User, (user) => user.tasks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  owner: User;

  @Column()
  @Index()
  ownerId: number;

  @ManyToOne(() => Organization, (org) => org.tasks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  organization: Organization;

  @Column()
  @Index()
  organizationId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
