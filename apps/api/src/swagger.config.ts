import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('TeamFlow API Engine')
  .setDescription('High-performance real-time project management monorepo API')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication and token lifecycle endpoints')
  .addTag('projects', 'Multi-tenant project boards and permissions')
  .addTag('tasks', 'Kanban lifecycle and reordering operations')
  .build();
