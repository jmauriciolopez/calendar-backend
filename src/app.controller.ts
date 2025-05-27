import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'Returns API information' })
  getRoot() {
    return {
      message: 'Calendar Management API',
      version: '1.0.0',
      docs: '/api-docs',
      health: '/health',
    };
  }
}