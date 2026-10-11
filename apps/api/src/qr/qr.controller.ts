import { Controller, Get, Query } from '@nestjs/common';
import { QrService } from './qr.service';

@Controller('kiosk')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get('qr')
  getQrPayload(@Query('branchId') branchId: string, @Query('kioskId') kioskId: string) {
    return this.qrService.generateQr(branchId || 'default-branch', kioskId || 'default-kiosk');
  }
}
