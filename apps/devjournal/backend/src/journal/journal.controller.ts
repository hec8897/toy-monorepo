import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { ConceptsService } from '@/concepts/concepts.service';
import { EntryConceptResponseDto } from '@/concepts/dto/entry-concept-response.dto';

import { CreateEntryDto } from './dto/create-entry.dto';
import { EntryResponseDto } from './dto/entry-response.dto';
import { JournalService } from './journal.service';

import type { User } from '@supabase/supabase-js';

type AuthenticatedRequest = Request & { user: User };

@Controller('entries')
@UseGuards(SupabaseAuthGuard)
export class JournalController {
  constructor(
    private readonly journalService: JournalService,
    private readonly conceptsService: ConceptsService,
  ) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest): Promise<EntryResponseDto[]> {
    return this.journalService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<EntryResponseDto> {
    return this.journalService.findOne(req.user.id, id);
  }

  @Get(':id/concepts')
  getEntryConcepts(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<EntryConceptResponseDto[]> {
    return this.conceptsService.findByEntry(id, req.user.id);
  }

  @Sse(':id/analysis')
  getAnalysisStream(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Observable<{ data: string; type?: string }>> {
    return this.journalService.getAnalysisStream(id, req.user.id);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEntryDto,
  ): Promise<EntryResponseDto> {
    return this.journalService.create(req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    return this.journalService.remove(req.user.id, id);
  }
}
