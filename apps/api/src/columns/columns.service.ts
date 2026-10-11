import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateColumnDto, UpdateColumnDto } from '@teamflow/shared';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.column.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        position: nextPosition,
      },
    });
  }

  async update(orgId: string, id: string, data: UpdateColumnDto) {
    const column = await this.prisma.column.findFirst({
      where: { id, project: { organizationId: orgId } },
    });
    if (!column) throw new NotFoundException('Column not found');
    
    return this.prisma.column.update({
      where: { id },
      data,
    });
  }

  async remove(orgId: string, id: string) {
    const column = await this.prisma.column.findFirst({
      where: { id, project: { organizationId: orgId } },
    });
    if (!column) throw new NotFoundException('Column not found');
    
    return this.prisma.column.delete({
      where: { id },
    });
  }
}
