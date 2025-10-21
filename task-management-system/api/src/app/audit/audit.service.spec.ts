import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { promises as fs } from 'fs';

jest.mock('fs', () => ({
  promises: {
    appendFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('record', () => {
    it('should write audit log entry to file', async () => {
      await service.record(1, 'CREATE', 'Task', 123, { title: 'Test' });

      expect(fs.appendFile).toHaveBeenCalled();
      const callArgs = (fs.appendFile as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toContain('"userId":1');
      expect(callArgs[1]).toContain('"action":"CREATE"');
    });

    it('should handle null userId', async () => {
      await service.record(null, 'READ', 'Task', 1);

      expect(fs.appendFile).toHaveBeenCalled();
    });
  });

  describe('readRecentLogs', () => {
    it('should read and parse log entries', async () => {
      const mockLog = '{"timestamp":"2024-01-01","userId":1,"action":"CREATE","resourceType":"Task","resourceId":1}';
      (fs.readFile as jest.Mock).mockResolvedValue(mockLog);

      const result = await service.readRecentLogs(100);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('CREATE');
    });

    it('should return empty array if file not found', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      const result = await service.readRecentLogs(100);

      expect(result).toEqual([]);
    });
  });
});
