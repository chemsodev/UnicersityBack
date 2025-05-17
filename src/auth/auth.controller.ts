import { Controller, Post, Body, Get, UseGuards, Request, Query, Header, Options, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('etudiant/login')
  async loginEtudiant(@Body() loginDto: LoginDto) {
    return this.authService.loginEtudiant(loginDto);
  }

  @Post('enseignant/login')
  async loginEnseignant(@Body() loginDto: LoginDto) {
    return this.authService.loginEnseignant(loginDto);
  }

  @Post('administrateur/login')
  async loginAdministrateur(
    @Body() loginDto: LoginDto,
    @Query('requestedRole') requestedRole?: string
  ) {
    return this.authService.loginAdministrateur(loginDto, requestedRole);
  }

  @Get('verify')
  @UseGuards(AuthGuard)
  async verifyToken(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('Invalid token');
    }
    return {
      userId: req.user.userId,
      email: req.user.email,
      adminRole: req.user.adminRole || req.user.role,
      userType: req.user.userType || req.user.type
    };
  }
  @Options('*')
  @Header('Access-Control-Allow-Origin', 'http://localhost:3001')
  @Header('Access-Control-Allow-Credentials', 'true')
  @Header('Access-Control-Allow-Headers', 'Authorization, Cache-Control, Content-Type')
  @Header('Access-Control-Max-Age', '86400') 
  handleOptions() {
    return {};
  }
}