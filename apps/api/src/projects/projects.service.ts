import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProjectDto, UpdateProjectDto } from '@teamflow/shared';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(orgId: string, data: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        organizationId: orgId,
        name: data.name,
        description: data.description,
      },
    });
  }

  findAll(orgId: string) {
    return this.prisma.project.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId: orgId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  update(orgId: string, id: string, data: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id, organizationId: orgId },
      data,
    });
  }

  remove(orgId: string, id: string) {
    return this.prisma.project.delete({
      where: { id, organizationId: orgId },
    });
  }
}
