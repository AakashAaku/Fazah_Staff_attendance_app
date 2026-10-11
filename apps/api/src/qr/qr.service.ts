import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID, createHmac } from 'crypto';

@Injectable()
export class QrService {
  private nonces = new Map<string, { branchId: string, kioskId: string, expiresAt: Date }>();
  private readonly secret = process.env.QR_SIGNING_MASTER_KEY || 'default-secret';

  generateQr(branchId: string, kioskId: string) {
    const nonce = randomUUID();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 45000); // 45 seconds TTL
    
    this.nonces.set(nonce, { branchId, kioskId, expiresAt });

    const payload = JSON.stringify({ branchId, kioskId, nonce, issuedAt, exp: expiresAt });
    const signature = createHmac('sha256', this.secret).update(payload).digest('hex');

    return { payload, signature };
  }

  verifyQr(payloadStr: string, signature: string): any {
    const expectedSig = createHmac('sha256', this.secret).update(payloadStr).digest('hex');
    if (expectedSig !== signature) {
      throw new BadRequestException('Invalid QR signature');
    }

    const payload = JSON.parse(payloadStr);
    const nonceData = this.nonces.get(payload.nonce);

    if (!nonceData) {
      throw new BadRequestException('QR code already used or expired');
    }

    if (nonceData.expiresAt < new Date()) {
      this.nonces.delete(payload.nonce);
      throw new BadRequestException('QR code expired');
    }

    // consume nonce
    this.nonces.delete(payload.nonce);

    return payload;
  }
}
