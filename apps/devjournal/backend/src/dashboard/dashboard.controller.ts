import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

import { DashboardService } from './dashboard.service';
import { ConceptGrowthPointDto } from './dto/concept-growth-response.dto';
import { DaysQueryDto } from './dto/days-query.dto';
import { HeatmapCellDto } from './dto/heatmap-response.dto';
import { KpisResponseDto } from './dto/kpis-response.dto';

import type { User } from '@supabase/supabase-js';

type AuthenticatedRequest = Request & { user: User };

const DEFAULT_GROWTH_DAYS = 90;
const DEFAULT_HEATMAP_DAYS = 91;

@Controller('dashboard')
@UseGuards(SupabaseAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKpis(@Req() req: AuthenticatedRequest): Promise<KpisResponseDto> {
    return this.dashboardService.getKpis(req.user.id);
  }

  @Get('concept-growth')
  getConceptGrowth(
    @Req() req: AuthenticatedRequest,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    )
    query: DaysQueryDto,
  ): Promise<ConceptGrowthPointDto[]> {
    const days = query.days ?? DEFAULT_GROWTH_DAYS;
    return this.dashboardService.getConceptGrowth(req.user.id, days);
  }

  @Get('heatmap')
  getHeatmap(
    @Req() req: AuthenticatedRequest,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    )
    query: DaysQueryDto,
  ): Promise<HeatmapCellDto[]> {
    const days = query.days ?? DEFAULT_HEATMAP_DAYS;
    return this.dashboardService.getEntryHeatmap(req.user.id, days);
  }
}
