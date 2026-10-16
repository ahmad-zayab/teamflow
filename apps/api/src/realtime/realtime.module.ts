import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway.js';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret',
    }),
  ],
  providers: [RealtimeGateway, WsJwtAuthGuard],
  exports: [RealtimeGateway, WsJwtAuthGuard],
})
export class RealtimeModule {}
