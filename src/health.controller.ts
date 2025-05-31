import { Controller, Get } from '@nestjs/common';
import { Public } from './lib/decorators/public-route.decorators';

@Controller()
export class HealthController {
  @Get('health')
  @Public()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
