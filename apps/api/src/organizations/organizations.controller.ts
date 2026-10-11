import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, UsePipes } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgGuard } from '../common/guards/org.guard.js';
import { CreateOrganizationSchema, UpdateOrganizationSchema } from '@teamflow/shared';
import type { CreateOrganizationDto, UpdateOrganizationDto } from '@teamflow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { Request } from 'express';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateOrganizationSchema))
  create(@Req() req: Request, @Body() body: CreateOrganizationDto) {
    const userId = (req as any).user.id;
    return this.orgService.create(userId, body);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.orgService.findAllForUser(userId);
  }

  @Get(':orgId')
  @UseGuards(OrgGuard)
  findOne(@Param('orgId') orgId: string) {
    return this.orgService.findOne(orgId);
  }

  @Patch(':orgId')
  @UseGuards(OrgGuard)
  @UsePipes(new ZodValidationPipe(UpdateOrganizationSchema))
  update(@Param('orgId') orgId: string, @Body() body: UpdateOrganizationDto) {
    return this.orgService.update(orgId, body);
  }
}
