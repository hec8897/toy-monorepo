import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

import { ConceptDetailDto } from './dto/concept-detail.dto';
import { MindmapGraphDto } from './dto/mindmap-graph.dto';
import { MindmapService } from './mindmap.service';

import type { User } from '@supabase/supabase-js';

type AuthenticatedRequest = Request & { user: User };

@Controller('mindmap')
@UseGuards(SupabaseAuthGuard)
export class MindmapController {
  constructor(private readonly mindmapService: MindmapService) {}

  @Get()
  getMyMindmap(@Req() req: AuthenticatedRequest): Promise<MindmapGraphDto> {
    return this.mindmapService.getUserMindmap(req.user.id);
  }

  @Get('concepts/:conceptId')
  getConceptDetail(
    @Req() req: AuthenticatedRequest,
    @Param('conceptId') conceptId: string,
  ): Promise<ConceptDetailDto> {
    return this.mindmapService.getConceptDetail(req.user.id, conceptId);
  }
}
