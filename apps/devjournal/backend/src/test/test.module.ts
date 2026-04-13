import { Module } from '@nestjs/common';

import { EmbeddingModule } from '@/embedding/embedding.module';

import { TestController } from './test.controller';

@Module({
  imports: [EmbeddingModule],
  controllers: [TestController],
})
export class TestModule {}
