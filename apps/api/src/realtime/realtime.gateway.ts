/**
 * @file realtime.gateway.ts
 * @description WebSocket gateway managing real-time connections, presence status,
 * project room joins/leaves, and task event broadcasts across TeamFlow boards.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard.js';

/**
 * Represents an active user presence record in a project room.
 */
interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  socketId: string;
}

/**
 * RealtimeGateway handles real-time bidirectional communication over Socket.IO.
 * - Authenticates incoming client connections via JWT.
 * - Manages presence tracking per project room.
 * - Enforces organization membership checks before allowing users to join project rooms.
 * - Broadcasts task lifecycle mutations (creation, updates, deletions) to project subscribers.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  
  // Track online users per project: Map<projectId, Map<socketId, PresenceUser>>
  private projectPresence = new Map<string, Map<string, PresenceUser>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly wsJwtAuthGuard: WsJwtAuthGuard,
  ) {}

  /**
   * Handles new WebSocket connections during handshake.
   * Extracts and validates the JWT; disconnects client immediately if authentication fails.
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.wsJwtAuthGuard.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected for socket ${client.id}: Missing authentication token`);
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret',
      });

      client.data = client.data || {};
      client.data.user = { id: payload.sub };

      this.logger.log(`Client authenticated and connected: ${client.id} (user: ${payload.sub})`);
    } catch (error) {
      this.logger.warn(`Connection rejected for socket ${client.id}: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  /**
   * Cleans up client socket state upon disconnection.
   * Removes client from all active project presence maps and broadcasts updated presence lists.
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove client from any project presence lists
    for (const [projectId, usersMap] of this.projectPresence.entries()) {
      if (usersMap.has(client.id)) {
        usersMap.delete(client.id);
        this.broadcastPresenceUpdate(projectId);
      }
    }
  }

  /**
   * Subscribes a client socket to a specific project room (`project:<projectId>`).
   * Validates organization membership before granting subscription.
   */
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('join:project')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const userId = client.data?.user?.id;
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    const projectId = data?.projectId;
    if (!projectId) {
      throw new WsException('Invalid payload: projectId is required');
    }

    // Validate that the user belongs to the project's organization
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          memberships: {
            some: {
              userId,
            },
          },
        },
      },
    });

    if (!project) {
      throw new WsException('Forbidden: You do not have access to this project organization');
    }

    await client.join(`project:${projectId}`);
    this.logger.log(`User ${userId} (socket ${client.id}) joined project:${projectId}`);

    // Emit current presence to the newly joined client
    this.broadcastPresenceUpdate(projectId);

    return { event: 'joined', projectId };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leave:project')
  async handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const projectId = data?.projectId;
    if (projectId) {
      await client.leave(`project:${projectId}`);

      const usersMap = this.projectPresence.get(projectId);
      if (usersMap && usersMap.has(client.id)) {
        usersMap.delete(client.id);
        this.broadcastPresenceUpdate(projectId);
      }

      this.logger.log(`Socket ${client.id} left project:${projectId}`);
      return { event: 'left', projectId };
    }
    return { event: 'left' };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('presence:join')
  handlePresenceJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      projectId: string; 
      id?: string; 
      name?: string; 
      avatar?: string; 
      user?: { id: string; name: string; avatar?: string } 
    },
  ) {
    const projectId = data?.projectId;
    if (!projectId) return;

    const userId = client.data?.user?.id || data?.id || data?.user?.id || client.id;
    const name = data?.name || data?.user?.name || 'Anonymous User';
    const avatar = data?.avatar || data?.user?.avatar;

    if (!this.projectPresence.has(projectId)) {
      this.projectPresence.set(projectId, new Map());
    }

    this.projectPresence.get(projectId)!.set(client.id, {
      id: userId,
      name,
      avatar,
      socketId: client.id,
    });

    this.logger.log(`Presence registered for user ${name} (${userId}) in project ${projectId}`);
    this.broadcastPresenceUpdate(projectId);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('presence:leave')
  handlePresenceLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const projectId = data?.projectId;
    if (projectId && this.projectPresence.has(projectId)) {
      this.projectPresence.get(projectId)!.delete(client.id);
      this.broadcastPresenceUpdate(projectId);
    }
  }

  private broadcastPresenceUpdate(projectId: string) {
    const usersMap = this.projectPresence.get(projectId);
    const uniqueUsers: Array<{ id: string; name: string; avatar?: string }> = [];

    if (usersMap) {
      for (const user of usersMap.values()) {
        if (!uniqueUsers.some((u) => u.id === user.id)) {
          uniqueUsers.push({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          });
        }
      }
    }

    this.emitToProject(projectId, 'presence:update', uniqueUsers);
  }

  /**
   * Broadcasts an event and payload to all connected clients within a project room.
   */
  emitToProject(projectId: string, event: string, payload: unknown) {
    if (this.server) {
      this.server.to(`project:${projectId}`).emit(event, payload);
    }
  }

  /**
   * Notifies project subscribers that a new task was created.
   */
  broadcastTaskCreated(projectId: string, task: unknown) {
    this.emitToProject(projectId, 'task:created', task);
  }

  /**
   * Notifies project subscribers that an existing task was updated.
   */
  broadcastTaskUpdated(projectId: string, task: unknown) {
    this.emitToProject(projectId, 'task:updated', task);
  }

  /**
   * Notifies project subscribers that a task was moved across columns or reordered.
   */
  broadcastTaskMoved(projectId: string, task: unknown) {
    this.emitToProject(projectId, 'task:moved', task);
  }

  /**
   * Notifies project subscribers that a task was deleted.
   */
  broadcastTaskDeleted(projectId: string, payload: { id: string; projectId: string; columnId: string }) {
    this.emitToProject(projectId, 'task:deleted', payload);
  }
}
