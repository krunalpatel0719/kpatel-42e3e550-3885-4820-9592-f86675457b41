import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  // Create test organization
  await dataSource.query(`
    INSERT INTO organizations (name, createdAt, updatedAt)
    VALUES ('Test Organization', datetime('now'), datetime('now'))
  `);

  console.log('✅ Seed data created successfully');
  console.log('   - Created organization: Test Organization (id: 1)');

  await app.close();
}

bootstrap();
