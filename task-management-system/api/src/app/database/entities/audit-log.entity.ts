import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Index()
  userId: number | null;

  @Column()
  action: string;

  @Column()
  resourceType: string;

  @Column({ nullable: true })
  resourceId: number | null;

  @Column({ type: 'simple-json' })
  meta: Record<string, any>;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}
