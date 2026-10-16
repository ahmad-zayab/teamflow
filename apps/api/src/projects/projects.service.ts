import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { CreateProjectDto, UpdateProjectDto } from '@teamflow/shared';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

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
    const cacheKey = `cache:project:${id}`;

    // 1. Attempt to fetch project board from Redis cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      // Validate that cached project belongs to the requesting organization
      if (cached.organizationId === orgId) {
        return cached;
      }
    }

    // 2. Fetch fresh project board from database
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

    // 3. Cache the project board in Redis with a TTL of 60 seconds
    await this.redisService.set(cacheKey, project, 60);

    return project;
  }

  async update(orgId: string, id: string, data: UpdateProjectDto) {
    const updated = await this.prisma.project.update({
      where: { id, organizationId: orgId },
      data,
    });

    // Invalidate project cache upon update
    await this.redisService.del(`cache:project:${id}`);

    return updated;
  }

  async remove(orgId: string, id: string) {
    const removed = await this.prisma.project.delete({
      where: { id, organizationId: orgId },
    });

    // Invalidate project cache upon removal
    await this.redisService.del(`cache:project:${id}`);

    return removed;
  }

  async invalidateCache(projectId: string): Promise<void> {
    await this.redisService.del(`cache:project:${projectId}`);
  }
}
