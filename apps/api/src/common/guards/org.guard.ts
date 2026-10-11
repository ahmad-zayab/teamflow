import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Request } from 'express';

@Injectable()
export class OrgGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const orgIdHeader = request.headers['x-org-id'];
    const orgId = (request.params['orgId'] || (Array.isArray(orgIdHeader) ? orgIdHeader[0] : orgIdHeader)) as string;

    if (!orgId) {
      throw new ForbiddenException('Organization ID is missing');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Attach membership/org info to request for convenience in route handlers
    (request as any).membership = membership;
    (request as any).orgId = orgId;

    return true;
  }
}
