import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
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
  async loginAdministrateur(@Body() loginDto: LoginDto) {
    return this.authService.loginAdministrateur(loginDto);
  }

  @Get('verify')
  @UseGuards(AuthGuard)
  async verifyToken(@Request() req) {
    return {
      userId: req.user.sub,
      email: req.user.email,
      userType: req.user.type,
      ...(req.user.adminRole && { adminRole: req.user.adminRole })
    };
  }
}