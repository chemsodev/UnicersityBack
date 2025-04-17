import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [ConfigModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get('JWT_SECRET'),
      signOptions: { expiresIn: configService.get('JWT_EXPIRATION_TIME') },
    }),
    inject: [ConfigService]
  })],
  exports: [AuthModule, JwtModule],
})
export class AuthModule { }
