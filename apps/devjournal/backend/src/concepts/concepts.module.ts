import { Module } from '@nestjs/common';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

import { ConceptsController } from './concepts.controller';
import { ConceptsService } from './concepts.service';

@Module({
  controllers: [ConceptsController],
  providers: [ConceptsService, SupabaseAuthGuard],
})
export class ConceptsModule {}
