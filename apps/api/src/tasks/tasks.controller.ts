import { Controller, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, Req } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import type { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '@teamflow/shared';
import { CreateTaskSchema, UpdateTaskSchema, MoveTaskSchema } from '@teamflow/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgGuard } from '../common/guards/org.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { Request } from 'express';

@Controller('tasks')
@UseGuards(JwtAuthGuard, OrgGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateTaskSchema))
  create(@Req() req: Request, @Body() createTaskDto: CreateTaskDto) {
    const orgId = (req as any).orgId;
    return this.tasksService.create(orgId, createTaskDto);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateTaskSchema))
  update(@Req() req: Request, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const orgId = (req as any).orgId;
    return this.tasksService.update(orgId, id, updateTaskDto);
  }

  @Patch(':id/move')
  @UsePipes(new ZodValidationPipe(MoveTaskSchema))
  move(@Req() req: Request, @Param('id') id: string, @Body() moveTaskDto: MoveTaskDto) {
    const orgId = (req as any).orgId;
    return this.tasksService.move(orgId, id, moveTaskDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const orgId = (req as any).orgId;
    return this.tasksService.remove(orgId, id);
  }
}
