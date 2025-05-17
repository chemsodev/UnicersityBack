import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Log the token payload for debugging
    this.logger.debug(`JWT payload: ${JSON.stringify(payload)}`);
    
    // Create a standardized user object
    const user = {
      userId: payload.userId,
      email: payload.email,
      adminRole: payload.adminRole || payload.role,
      userType: payload.userType || payload.type,
      teacherId: payload.teacherId,
      matricule: payload.matricule
    };
    
    this.logger.debug(`Normalized user from JWT: ${JSON.stringify(user)}`);
    return user;
  }
} 