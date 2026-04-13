import { Body, Controller, Post } from '@nestjs/common';

import { EmbeddingService } from '@/embedding/embedding.service';

@Controller('test')
export class TestController {
  constructor(private readonly embedding: EmbeddingService) {}

  @Post('embed')
  async embed(@Body() body: { text: string }) {
    const embedding = await this.embedding.embed(body.text);
    return { embedding, dimension: embedding.length };
  }
}
