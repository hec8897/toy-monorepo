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
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

import { CreateEntryDto } from './dto/create-entry.dto';
import { EntryResponseDto } from './dto/entry-response.dto';
import { JournalService } from './journal.service';

import type { User } from '@supabase/supabase-js';

type AuthenticatedRequest = Request & { user: User };

@Controller('entries')
@UseGuards(SupabaseAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

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
