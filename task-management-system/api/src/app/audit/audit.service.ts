import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface AuditLogEntry {
  timestamp: string;
  userId: number | null;
  action: string;
  resourceType: string;
  resourceId: number | null;
  meta?: any;
}

@Injectable()
export class AuditService {
  private readonly logFilePath = path.join(
    process.cwd(),
    'api',
    'data',
    'audit.log'
  );

  async record(
    userId: number | null,
    action: string,
    resourceType: string,
    resourceId: number | null,
    meta: any = {}
  ): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resourceType,
      resourceId,
      meta,
    };

    const line = JSON.stringify(entry) + '\n';

    try {
      await fs.appendFile(this.logFilePath, line, 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async readRecentLogs(limit: number = 200): Promise<AuditLogEntry[]> {
    try {
      const content = await fs.readFile(this.logFilePath, 'utf8');
      const lines = content
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);

      const entries: AuditLogEntry[] = lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((entry) => entry !== null);

      // Return most recent entries first
      return entries.slice(-limit).reverse();
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
