import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Task } from './task.entity';

export enum UserRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @ManyToOne(() => Organization, (org) => org.users, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  organization: Organization;

  @Column()
  @Index()
  organizationId: number;

  @OneToMany(() => Task, (task) => task.owner)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
