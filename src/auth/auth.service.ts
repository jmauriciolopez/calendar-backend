import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(googleToken: string): Promise<{ access_token: string }> {
    // Validación ficticia de GoogleToken. Aquí debes validar realmente.
    const tenantId = 'tenant123';
    const payload = { sub: 'user-id', tenant_id: tenantId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
