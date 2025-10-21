export interface IAuditLog {
  id: number;
  userId: number | null;
  action: string;
  resourceType: string;
  resourceId: number | null;
  meta: Record<string, any>;
  timestamp: Date;
}

export interface IAuditLogQuery {
  userId?: number;
  action?: string;
  resourceType?: string;
  resourceId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
