import { Module } from '@nestjs/common';

import { AgentModule } from '@/agent/agent.module';
import { EmbeddingModule } from '@/embedding/embedding.module';

import { TestController } from './test.controller';

@Module({
  imports: [EmbeddingModule, AgentModule],
  controllers: [TestController],
})
export class TestModule {}
