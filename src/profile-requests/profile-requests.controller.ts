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
  Logger,
} from "@nestjs/common";
import { ProfileRequestsService } from "./profile-requests.service";
import { CreateProfileRequestDto } from "./dto/create-profile-request.dto";
import { UpdateProfileRequestDto } from "./dto/update-profile-request.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";
import { ProfileRequestStatus } from "./profile-request.entity";
import { RolesUtil } from "../utils/roles.util";

@Controller("profile-requests")
@UseGuards(AuthGuard, RolesGuard)
export class ProfileRequestsController {
  private readonly logger = new Logger(ProfileRequestsController.name);

  constructor(
    private readonly profileRequestsService: ProfileRequestsService
  ) {}

  @Post()
  @Roles(AdminRole.ETUDIANT)
  async create(
    @Body() createProfileRequestDto: CreateProfileRequestDto,
    @Request() req
  ) {
    this.logger.log(
      `Creating profile request: ${JSON.stringify(createProfileRequestDto)}`
    );
    this.logger.log(`User in request: ${JSON.stringify(req.user)}`);

    // Ensure students can only create requests for themselves
    if (req.user.userId != createProfileRequestDto.studentId) {
      throw new ForbiddenException(
        "Vous ne pouvez créer des demandes que pour votre propre profil"
      );
    }

    return this.profileRequestsService.create(createProfileRequestDto);
  }

  @Get()
  @Roles(...RolesUtil.getAdminRoles())
  findAll() {
    return this.profileRequestsService.findAll();
  }

  @Get("my-requests")
  @Roles(AdminRole.ETUDIANT)
  getMyRequests(@Request() req) {
    this.logger.log(`Getting requests for user: ${req.user.userId}`);
    return this.profileRequestsService.findByStudent(req.user.userId);
  }

  @Get("pending")
  @Roles(...RolesUtil.getAdminRoles())
  findPending() {
    return this.profileRequestsService.findByStatus("pending");
  }

  @Get("student/:id")
  @Roles(AdminRole.ETUDIANT, ...RolesUtil.getAdminRoles())
  async findByStudent(@Param("id") id: string, @Request() req) {
    // Students can only view their own requests
    if (req.user.adminRole === AdminRole.ETUDIANT && req.user.userId != id) {
      throw new UnauthorizedException(
        "Vous ne pouvez voir que vos propres demandes"
      );
    }

    return this.profileRequestsService.findByStudent(id);
  }

  @Get(":id")
  @Roles(AdminRole.ETUDIANT, ...RolesUtil.getAdminRoles())
  async findOne(@Param("id") id: string, @Request() req) {
    const request = await this.profileRequestsService.findOne(id);

    // Students can only view their own requests
    if (
      req.user.adminRole === AdminRole.ETUDIANT &&
      req.user.userId != request.studentId
    ) {
      throw new UnauthorizedException(
        "Vous ne pouvez voir que vos propres demandes"
      );
    }

    return request;
  }

  @Patch(":id")
  @Roles(...RolesUtil.getAdminRoles())
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

  @Patch(":id/cancel")
  @Roles(AdminRole.ETUDIANT)
  async cancelRequest(
    @Param("id") id: string,
    @Body() updateData: UpdateProfileRequestDto,
    @Request() req
  ) {
    const request = await this.profileRequestsService.findOne(id);

    // Students can only cancel their own requests
    if (req.user.userId != request.studentId) {
      throw new ForbiddenException(
        "Vous ne pouvez annuler que vos propres demandes"
      );
    }

    // Only pending requests can be canceled
    if (request.status !== ProfileRequestStatus.PENDING) {
      throw new ForbiddenException(
        "Seules les demandes en attente peuvent être annulées"
      );
    }

    return this.profileRequestsService.update(id, {
      ...updateData,
      status: ProfileRequestStatus.CANCELLED,
    });
  }

  @Delete(":id")
  @Roles(...RolesUtil.getAdminRoles())
  remove(@Param("id") id: string) {
    return this.profileRequestsService.remove(id);
  }
}
