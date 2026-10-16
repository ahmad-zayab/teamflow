import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { RedisService } from '../redis/redis.service.js';
import type { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '@teamflow/shared';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly redisService: RedisService,
  ) {}

  async create(orgId: string, data: CreateTaskDto) {
    // Verify project belongs to the org
    const project = await this.prisma.project.findFirst({
      where: { id: data.projectId, organizationId: orgId },
    });
    
    if (!project) {
      throw new NotFoundException('Project not found or not in this organization');
    }

    // Get max position in column
    const maxPosResult = await this.prisma.task.aggregate({
      where: { columnId: data.columnId },
      _max: { position: true },
    });
    
    const nextPosition = (maxPosResult._max.position ?? 0) + 1;

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        columnId: data.columnId,
        position: nextPosition,
      },
    });

    // Invalidate project board cache
    await this.redisService.del(`cache:project:${task.projectId}`);

    // Broadcast creation event to project room
    this.realtimeGateway.emitToProject(task.projectId, 'task:created', task);

    return task;
  }

  async move(orgId: string, id: string, data: MoveTaskDto) {
    const movedTask = await this.prisma.$transaction(async (tx) => {
      // 1. Get the task being moved and verify ownership via project
      const task = await tx.task.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!task || task.project.organizationId !== orgId) {
        throw new NotFoundException('Task not found');
      }

      const oldColumnId = task.columnId;
      const oldPosition = task.position;
      const { newColumnId, newPosition } = data;

      if (oldColumnId === newColumnId && oldPosition === newPosition) {
        return task; // Nothing to do
      }

      if (oldColumnId === newColumnId) {
        // Moving within the same column
        if (newPosition > oldPosition) {
          // Moving down: shift items between oldPosition+1 and newPosition UP by 1
          await tx.task.updateMany({
            where: {
              columnId: oldColumnId,
              position: { gt: oldPosition, lte: newPosition },
            },
            data: { position: { decrement: 1 } },
          });
        } else {
          // Moving up: shift items between newPosition and oldPosition-1 DOWN by 1
          await tx.task.updateMany({
            where: {
              columnId: oldColumnId,
              position: { gte: newPosition, lt: oldPosition },
            },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        // Moving to a different column
        // 1. Verify new column exists and is in the same project
        const newColumn = await tx.column.findFirst({
          where: { id: newColumnId, projectId: task.projectId },
        });
        
        if (!newColumn) {
          throw new BadRequestException('Target column not found in this project');
        }

        // 2. Shift items in old column UP to fill the gap
        await tx.task.updateMany({
          where: {
            columnId: oldColumnId,
            position: { gt: oldPosition },
          },
          data: { position: { decrement: 1 } },
        });

        // 3. Shift items in new column DOWN to make space
        await tx.task.updateMany({
          where: {
            columnId: newColumnId,
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      // Finally, update the task with its new column and position
      return tx.task.update({
        where: { id },
        data: {
          columnId: newColumnId,
          position: newPosition,
        },
      });
    });

    // Invalidate project board cache
    await this.redisService.del(`cache:project:${movedTask.projectId}`);

    // Broadcast move event to project room
    this.realtimeGateway.emitToProject(movedTask.projectId, 'task:moved', movedTask);

    return movedTask;
  }

  async update(orgId: string, id: string, data: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id, project: { organizationId: orgId } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data,
    });

    // Invalidate project board cache
    await this.redisService.del(`cache:project:${updatedTask.projectId}`);

    // Broadcast update event to project room
    this.realtimeGateway.emitToProject(updatedTask.projectId, 'task:updated', updatedTask);

    return updatedTask;
  }

  async remove(orgId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, project: { organizationId: orgId } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    
    const deletedTask = await this.prisma.task.delete({
      where: { id },
    });

    // Invalidate project board cache
    await this.redisService.del(`cache:project:${deletedTask.projectId}`);

    // Broadcast deletion event to project room
    this.realtimeGateway.emitToProject(deletedTask.projectId, 'task:deleted', {
      id: deletedTask.id,
      projectId: deletedTask.projectId,
      columnId: deletedTask.columnId,
    });

    return deletedTask;
  }
}
