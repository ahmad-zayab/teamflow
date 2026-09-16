import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(userId: string, name: string, slug: string) {
    return this.prisma.organization.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },
      include: { members: true },
    });
  }

  async getOrganizationBySlug(slug: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!org || org.members.length === 0) {
      throw new NotFoundException('Organization not found or access denied');
    }

    return org;
  }
}
