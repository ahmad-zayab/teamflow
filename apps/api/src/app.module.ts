import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { ColumnsModule } from './columns/columns.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    OrganizationsModule,
    ProjectsModule,
    ColumnsModule,
    TasksModule,
    RealtimeModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
