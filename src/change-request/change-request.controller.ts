// src/change-request/change-request.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ChangeRequestService } from "./change-request.service";
import { AuthGuard } from "../auth/auth.guard";
import { AdminRole } from "../user.entity";
import { Roles } from "src/roles/roles.decorator";
import { RolesGuard } from "src/roles/roles.guard";
import {
  CreateChangeRequestDto,
  RequestStatus,
  UpdateRequestStatusDto,
} from "./change-request.entity";
import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";

@Controller("change-requests")
@UseGuards(AuthGuard)
export class ChangeRequestController {
  constructor(private readonly service: ChangeRequestService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  @UseInterceptors(
    FileInterceptor("document", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx)$/)) {
          return cb(
            new BadRequestException(
              "Only image, PDF, and Word files are allowed"
            ),
            false
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    })
  )
  async createRequest(
    @Request() req,
    @Body() createDto: CreateChangeRequestDto,
    @UploadedFile() document?: Express.Multer.File
  ) {
    let documentPath = null;
    if (document) {
      documentPath = `/uploads/${document.filename}`;
    }
    return this.service.createRequest(req.user.userId, createDto, documentPath);
  }

  @Get("my-requests")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  async getMyRequests(@Request() req) {
    return this.service.getStudentRequests(req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async getAllRequests() {
    return this.service.getAllRequests();
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async updateRequestStatus(
    @Param("id") id: string,
    @Body() updateDto: UpdateRequestStatusDto
  ) {
    return this.service.updateRequestStatus(id, updateDto);
  }

  @Patch(":id/cancel")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  async cancelRequest(@Request() req, @Param("id") id: string) {
    // Create a DTO with cancelled status
    const updateDto: UpdateRequestStatusDto = {
      status: RequestStatus.CANCELLED,
      responseMessage: "Demande annulée par l'étudiant",
    };

    // Make sure the request belongs to the current user
    return this.service.cancelStudentRequest(req.user.userId, id, updateDto);
  }

  @Get(":id")
  async getRequestById(@Request() req, @Param("id") id: string) {
    const userId = req.user.userId;
    const userRole = req.user.adminRole;

    // Students can only access their own requests
    if (userRole === AdminRole.ETUDIANT) {
      return this.service.getStudentRequestById(userId, id);
    }

    // Admin users can access any request
    return this.service.getRequestById(id);
  }
}
