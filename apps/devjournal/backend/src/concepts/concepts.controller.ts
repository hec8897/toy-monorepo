import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

import { ConceptsService } from './concepts.service';
import { ConceptResponseDto } from './dto/concept-response.dto';
import { UserConceptResponseDto } from './dto/user-concept-response.dto';

import type { User } from '@supabase/supabase-js';

type AuthenticatedRequest = Request & { user: User };

@Controller('concepts')
@UseGuards(SupabaseAuthGuard)
export class ConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Get()
  findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<ConceptResponseDto[]> {
    return this.conceptsService.findAll(limit, offset);
  }

  @Get('user')
  findUserConcepts(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserConceptResponseDto[]> {
    return this.conceptsService.findUserConcepts(req.user.id);
  }

  @Get('search')
  search(@Query('q') query: string): Promise<ConceptResponseDto[]> {
    return this.conceptsService.search(query ?? '');
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ConceptResponseDto> {
    return this.conceptsService.findOne(id);
  }
}
