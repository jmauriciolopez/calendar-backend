import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    loginWithGoogle(token: string): Promise<{
        access_token: string;
    }>;
}
