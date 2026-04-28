import { Module } from '@nestjs/common';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { EmbeddingModule } from '@/embedding/embedding.module';

import { ConceptsController } from './concepts.controller';
import { ConceptsService } from './concepts.service';

@Module({
  imports: [EmbeddingModule],
  controllers: [ConceptsController],
  providers: [ConceptsService, SupabaseAuthGuard],
  exports: [ConceptsService],
})
export class ConceptsModule {}
