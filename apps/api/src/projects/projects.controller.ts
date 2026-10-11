import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import type { CreateProjectDto, UpdateProjectDto } from '@teamflow/shared';
import { CreateProjectSchema, UpdateProjectSchema } from '@teamflow/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgGuard } from '../common/guards/org.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { Request } from 'express';

@Controller('projects')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateProjectSchema))
  create(@Req() req: Request, @Body() createProjectDto: CreateProjectDto) {
    const orgId = (req as any).orgId;
    return this.projectsService.create(orgId, createProjectDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const orgId = (req as any).orgId;
    return this.projectsService.findAll(orgId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const orgId = (req as any).orgId;
    return this.projectsService.findOne(orgId, id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateProjectSchema))
  update(@Req() req: Request, @Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    const orgId = (req as any).orgId;
    return this.projectsService.update(orgId, id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const orgId = (req as any).orgId;
    return this.projectsService.remove(orgId, id);
  }
}
