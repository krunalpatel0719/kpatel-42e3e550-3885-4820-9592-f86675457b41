import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization, User, Task, AuditLog } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, Task, AuditLog]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
