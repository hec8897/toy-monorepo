import { Body, Controller, Post } from '@nestjs/common';

import { AgentService } from '@/agent/agent.service';
import { ConceptsService } from '@/concepts/concepts.service';
import { EmbeddingService } from '@/embedding/embedding.service';

@Controller('test')
export class TestController {
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly agent: AgentService,
    private readonly concepts: ConceptsService,
  ) {}

  @Post('embed')
  async embed(@Body() body: { text: string }) {
    const embedding = await this.embedding.embed(body.text);
    return { embedding, dimension: embedding.length };
  }

  @Post('extract')
  async extract(@Body() body: { content: string }) {
    return this.agent.extractConcepts(body.content);
  }

  @Post('pipeline')
  async pipeline(
    @Body() body: { content: string; entryId: string; userId: string },
  ) {
    const result = await this.agent.extractConcepts(body.content);
    await this.concepts.upsertBatch(body.entryId, body.userId, result.concepts);
    return {
      ...result,
      saved: result.concepts.length,
    };
  }
}
