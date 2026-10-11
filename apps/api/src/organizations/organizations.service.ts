import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrganizationDto, UpdateOrganizationDto } from '@teamflow/shared';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        memberships: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },
    });
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });
    return memberships.map(m => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async findOne(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async update(orgId: string, data: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }
}
