import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/dev.sqlite',
      autoLoadEntities: true,
      synchronize: true, // DEV ONLY - will use migrations in Phase 9
      logging: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    TasksModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
