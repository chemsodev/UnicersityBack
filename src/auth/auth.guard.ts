import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { AdminRole } from 'src/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private configService: ConfigService,
        private jwtService: JwtService,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token not found');
        }

        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
            });

            request.user = payload;
        } catch (err) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }

    private extractTokenFromHeader(request: any): string | null {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
    }
}

declare global {
    namespace Express {
        export interface Request {
            user?: {
                sub: string;
                email: string;
                role: AdminRole
            };
        }
    }
}