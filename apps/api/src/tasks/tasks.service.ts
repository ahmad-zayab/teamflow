import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, Priority } from '@prisma/client';

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  creatorId: string;
  assigneeId?: string;
  priority?: Priority;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(input: CreateTaskInput) {
    const highestOrder = await this.prisma.task.findFirst({
      where: { projectId: input.projectId, status: TaskStatus.TODO },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = highestOrder ? highestOrder.order + 1000 : 1000;

    return this.prisma.task.create({
      data: {
        ...input,
        order: nextOrder,
        status: TaskStatus.TODO,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async reorderTask(taskId: string, newStatus: TaskStatus, newOrder: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        order: newOrder,
      },
    });
  }
}
