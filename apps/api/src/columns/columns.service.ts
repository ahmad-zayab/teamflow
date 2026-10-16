import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { CreateColumnDto, UpdateColumnDto } from '@teamflow/shared';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(orgId: string, data: CreateColumnDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: data.projectId, organizationId: orgId },
    });
    
    if (!project) throw new NotFoundException('Project not found or not in this organization');

    const maxPosResult = await this.prisma.column.aggregate({
      where: { projectId: data.projectId },
      _max: { position: true },
    });
    
    const nextPosition = (maxPosResult._max.position ?? 0) + 1;

    const column = await this.prisma.column.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        position: nextPosition,
      },
    });

    // Invalidate project board cache
    await this.redisService.del(`cache:project:${data.projectId}`);

    return column;
  }

  async update(orgId: string, id: string, data: UpdateColumnDto) {
    const column = await this.prisma.column.findFirst({
      where: { id, project: { organizationId: orgId } },
    });
    if (!column) throw new NotFoundException('Column not found');
    
    const updated = await this.prisma.column.update({
      where: { id },
      data,
    });

    // Invalidate project board cache
    await this.redisService.del(`cache:project:${column.projectId}`);

    return updated;
  }

  async remove(orgId: string, id: string) {
    const column = await this.prisma.column.findFirst({
      where: { id, project: { organizationId: orgId } },
    });
    if (!column) throw new NotFoundException('Column not found');
    
    const deleted = await this.prisma.column.delete({
      where: { id },
    });

    // Invalidate project board cache
    await this.redisService.del(`cache:project:${column.projectId}`);

    return deleted;
  }
}
