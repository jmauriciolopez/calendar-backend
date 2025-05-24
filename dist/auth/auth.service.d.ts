import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    login(googleToken: string): Promise<{
        access_token: string;
    }>;
}
