import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockService = {
      readRecentLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return audit logs with default limit', async () => {
      const mockLogs = [{ timestamp: '2024-01-01', action: 'CREATE' }];
      service.readRecentLogs.mockResolvedValue(mockLogs as any);

      const result = await controller.list();

      expect(service.readRecentLogs).toHaveBeenCalledWith(200);
      expect(result).toEqual(mockLogs);
    });

    it('should return audit logs with custom limit', async () => {
      service.readRecentLogs.mockResolvedValue([]);

      await controller.list(50);

      expect(service.readRecentLogs).toHaveBeenCalledWith(50);
    });
  });
});
