import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok' as const,
      service: 'content-pipeline-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
