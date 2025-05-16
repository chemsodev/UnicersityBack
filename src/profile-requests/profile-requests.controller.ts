import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { ProfileRequestsService } from "./profile-requests.service";
import { CreateProfileRequestDto } from "./dto/create-profile-request.dto";
import { UpdateProfileRequestDto } from "./dto/update-profile-request.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";

@Controller("profile-requests")
@UseGuards(JwtAuthGuard)
export class ProfileRequestsController {
  constructor(
    private readonly profileRequestsService: ProfileRequestsService
  ) {}

  @Post()
  async create(
    @Body() createProfileRequestDto: CreateProfileRequestDto,
    @Request() req
  ) {
    // Ensure students can only create requests for themselves
    if (
      req.user.userType === "etudiant" &&
      req.user.userId !== createProfileRequestDto.studentId
    ) {
      throw new ForbiddenException(
        "Vous ne pouvez créer des demandes que pour votre propre profil"
      );
    }

    return this.profileRequestsService.create(createProfileRequestDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE)
  findAll() {
    return this.profileRequestsService.findAll();
  }

  @Get("pending")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE)
  findPending() {
    return this.profileRequestsService.findByStatus("pending");
  }

  @Get("student/:id")
  async findByStudent(@Param("id") id: string, @Request() req) {
    // Students can only view their own requests
    if (req.user.userType === "etudiant" && req.user.userId !== id) {
      throw new UnauthorizedException(
        "Vous ne pouvez voir que vos propres demandes"
      );
    }

    return this.profileRequestsService.findByStudent(id);
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE)
  findOne(@Param("id") id: string) {
    return this.profileRequestsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE)
  update(
    @Param("id") id: string,
    @Body() updateProfileRequestDto: UpdateProfileRequestDto,
    @Request() req
  ) {
    // Store the admin ID who processed the request
    return this.profileRequestsService.update(id, {
      ...updateProfileRequestDto,
      processedById: req.user.userId,
    });
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE)
  remove(@Param("id") id: string) {
    return this.profileRequestsService.remove(id);
  }
}
