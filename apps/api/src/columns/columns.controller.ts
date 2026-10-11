import { Controller, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, Req } from '@nestjs/common';
import { ColumnsService } from './columns.service.js';
import type { CreateColumnDto, UpdateColumnDto } from '@teamflow/shared';
import { CreateColumnSchema, UpdateColumnSchema } from '@teamflow/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgGuard } from '../common/guards/org.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { Request } from 'express';

@Controller('columns')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateColumnSchema))
  create(@Req() req: Request, @Body() createColumnDto: CreateColumnDto) {
    const orgId = (req as any).orgId;
    return this.columnsService.create(orgId, createColumnDto);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateColumnSchema))
  update(@Req() req: Request, @Param('id') id: string, @Body() updateColumnDto: UpdateColumnDto) {
    const orgId = (req as any).orgId;
    return this.columnsService.update(orgId, id, updateColumnDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const orgId = (req as any).orgId;
    return this.columnsService.remove(orgId, id);
  }
}
