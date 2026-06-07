import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return this.getHealthStatus();
  }

  @Public()
  @Get('api/health')
  apiHealth() {
    return this.getHealthStatus();
  }

  private getHealthStatus() {
    return {
      status: 'ok',
      app: 'Task Management System',
      time: new Date().toISOString(),
    };
  }
}
