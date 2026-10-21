/**
 * @file realtime.module.ts
 * @description NestJS module configuring the real-time communication subsystem for TeamFlow.
 * Provides WebSocket gateways, Redis Pub/Sub integration, and WebSocket JWT authentication guards.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway.js';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

/**
 * RealtimeModule encapsulates WebSocket functionality:
 * - Manages WebSocket client connections and live project room subscriptions.
 * - Handles user presence (online status and active collaborators per project).
 * - Broadcasts task lifecycle events (creation, updates, movement, deletion).
 * - Secures WebSocket events via JWT token extraction and validation.
 */
@Module({
  imports: [
    // Database access for verifying project membership and authorizations
    PrismaModule,
    // Configures JWT verification for authenticating WebSocket handshakes and messages
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret',
    }),
  ],
  // Gateway and guards instantiated within this module
  providers: [RealtimeGateway, WsJwtAuthGuard],
  // Exported so feature modules (e.g., TasksModule) can inject RealtimeGateway to broadcast changes
  exports: [RealtimeGateway, WsJwtAuthGuard],
})
export class RealtimeModule {}

