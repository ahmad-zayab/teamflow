import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to real-time events: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinProjectRoom')
  handleJoinProject(client: Socket, projectId: string) {
    client.join(`project:${projectId}`);
    this.logger.log(`Socket ${client.id} joined room project:${projectId}`);
    return { status: 'joined', room: `project:${projectId}` };
  }
}

  broadcastTaskMoved(projectId: string, payload: { taskId: string; newStatus: string; newOrder: number }) {
    this.server.to(`project:${projectId}`).emit('taskMoved', payload);
  }

  broadcastTaskCreated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit('taskCreated', task);
  }
