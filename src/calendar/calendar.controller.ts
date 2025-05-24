import { Controller, Get, Req } from '@nestjs/common';

@Controller('calendar')
export class CalendarController {
  @Get('events')
  getEvents(@Req() req) {
    return [{ id: 1, title: 'Sample Event from tenant', tenant: req.user?.tenant_id || 'unknown' }];
  }
}
