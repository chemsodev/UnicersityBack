import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  Header,
  Options,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { AuthGuard } from "./auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("etudiant/login")
  async loginEtudiant(@Body() loginDto: LoginDto) {
    return this.authService.loginEtudiant(loginDto);
  }

  @Post("enseignant/login")
  async loginEnseignant(@Body() loginDto: LoginDto) {
    return this.authService.loginEnseignant(loginDto);
  }

  @Post("administrateur/login")
  async loginAdministrateur(
    @Body() loginDto: LoginDto,
    @Query("requestedRole") requestedRole?: string
  ) {
    return this.authService.loginAdministrateur(loginDto, requestedRole);
  }
  @Get("verify")
  @UseGuards(AuthGuard)
  async verifyToken(
    @Request() req,
    @Query("requestedRole") requestedRole?: string
  ) {
    if (!req.user) {
      throw new UnauthorizedException("Invalid token");
    }

    const userRole = req.user.adminRole || req.user.role;
    const userType = req.user.userType || req.user.type;

    // If a specific role is requested, check if user has access to it
    if (requestedRole && userRole !== requestedRole) {
      // Check role hierarchy permissions here if needed
      console.log(
        `User with role ${userRole} is accessing ${requestedRole} page`
      );
    }

    return {
      userId: req.user.userId,
      email: req.user.email,
      adminRole: userRole,
      userType: userType,
      requestedRole: requestedRole || userRole,
    };
  }
  @Options("*")
  @Header("Access-Control-Allow-Origin", "http://localhost:3001")
  @Header("Access-Control-Allow-Credentials", "true")
  @Header(
    "Access-Control-Allow-Headers",
    "Authorization, Cache-Control, Content-Type"
  )
  @Header("Access-Control-Max-Age", "86400")
  handleOptions() {
    return {};
  }
}
