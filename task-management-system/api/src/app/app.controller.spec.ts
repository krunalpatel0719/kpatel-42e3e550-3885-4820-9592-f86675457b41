import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let app: TestingModule;
  let appController: AppController;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return health status with ok status', () => {
      const result = appController.healthCheck();
      expect(result).toHaveProperty('status', 'ok');
    });

    it('should return health status with timestamp', () => {
      const result = appController.healthCheck();
      expect(result).toHaveProperty('timestamp');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return health status with service name', () => {
      const result = appController.healthCheck();
      expect(result).toHaveProperty('service', 'Task Management System API');
    });
  });
});
