import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIMENSIONS = 768;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: EMBED_MODEL });
    this.logger.log(
      `EmbeddingService initialized (model: ${EMBED_MODEL}, dim: ${EMBED_DIMENSIONS})`,
    );
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      outputDimensionality: EMBED_DIMENSIONS,
    } as Parameters<typeof this.model.embedContent>[0]);
    return result.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
