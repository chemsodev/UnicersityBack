import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
}