import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(orgId: string, title: string, key: string, description?: string) {
    const existing = await this.prisma.project.findUnique({
      where: {
        organizationId_key: {
          organizationId: orgId,
          key: key.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Project key ${key} already exists in this organization`);
    }

    return this.prisma.project.create({
      data: {
        title,
        key: key.toUpperCase(),
        description,
        organizationId: orgId,
      },
    });
  }

  async getProjectsByOrg(orgId: string) {
    return this.prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
