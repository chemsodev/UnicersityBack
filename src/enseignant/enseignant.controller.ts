import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  UseGuards,
  Request,
  Res,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { EnseignantService } from "./enseignant.service";
import { CreateEnseignantDto } from "./dto/create-enseignant.dto";
import { Enseignant } from "./enseignant.entity";
import { UpdateEnseignantDto } from "./dto/update-enseignant.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";
import { Schedule } from "../schedules/entities/schedule.entity";
import { toNumberId } from "../utils/id-conversion.util";
import { Etudiant } from "../etudiant/etudiant.entity";
import { SectionResponsable } from "../section/section-responsable.entity";
import { Section } from "../section/section.entity";
import { ChangeRequest } from "../change-request/change-request.entity";
import { Response } from "express";
import { JwtService } from "@nestjs/jwt";

@Controller("enseignants")
@UseGuards(JwtAuthGuard)
export class EnseignantController {
  constructor(private readonly enseignantService: EnseignantService) {}

  @Post()
  async create(
    @Body() createEnseignantDto: CreateEnseignantDto
  ): Promise<Enseignant> {
    return this.enseignantService.create(createEnseignantDto);
  }

  @Get()
  async findAll(): Promise<Enseignant[]> {
    return this.enseignantService.findAll();
  }

  @Get("group-change-requests")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ENSEIGNANT)
  async getGroupChangeRequests(@Request() req) {
    const teacherId = req.user.userId;
    return this.enseignantService.getGroupChangeRequests(teacherId);
  }

  @Patch("group-change-requests/:requestId")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ENSEIGNANT)
  async handleGroupChangeRequest(
    @Request() req,
    @Param("requestId") requestId: string,
    @Body() updateData: { status: string }
  ) {
    const teacherId = req.user.userId;
    return this.enseignantService.updateGroupChangeRequestStatus(
      teacherId,
      requestId,
      updateData.status
    );
  }

  @Get("group-change-requests/:requestId/document")
  async getChangeRequestDocument(
    @Request() req,
    @Param("requestId") requestId: string,
    @Query("token") token: string,
    @Res() res: Response
  ) {
    try {
      // Allow authentication via query parameter token or Authorization header
      let teacherId;

      // First check if token is provided in query parameters
      if (token) {
        try {
          // Import JWT service to verify the token
          const jwtService = new JwtService({
            secret: process.env.JWT_SECRET || "secretKey",
          });

          // Verify and decode the token
          const decoded = jwtService.verify(token);
          teacherId = decoded.userId;
        } catch (error) {
          throw new UnauthorizedException(
            "Invalid token provided in query parameter"
          );
        }
      } else {
        // Fall back to req.user from JwtAuthGuard
        teacherId = req.user.userId;
      }

      if (!teacherId) {
        throw new UnauthorizedException("Teacher ID not found in token");
      }

      const document = await this.enseignantService.getChangeRequestDocument(
        teacherId,
        requestId
      );

      if (!document || (!document.documentData && !document.documentPath)) {
        return res.status(204).send(); // No Content
      }

      // Determine MIME type
      let mimeType = document.documentMimeType || "application/octet-stream";

      // Try to determine MIME type from filename if not available
      if (!mimeType || mimeType === "application/octet-stream") {
        if (document.documentName) {
          const extension = document.documentName
            .split(".")
            .pop()
            ?.toLowerCase();
          if (extension) {
            switch (extension) {
              case "jpg":
              case "jpeg":
                mimeType = "image/jpeg";
                break;
              case "png":
                mimeType = "image/png";
                break;
              case "pdf":
                mimeType = "application/pdf";
                break;
              case "doc":
                mimeType = "application/msword";
                break;
              case "docx":
                mimeType =
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                break;
            }
          }
        }
      }

      // Set appropriate headers
      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${
          document.documentName || "document"
        }"`,
        "Content-Length": document.documentData
          ? document.documentData.length
          : 0,
        "Cache-Control": "public, max-age=3600",
      });

      // Send the document data
      return res.send(document.documentData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ForbiddenException) {
        throw error;
      } else if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new BadRequestException(
          `Error retrieving document: ${error.message}`
        );
      }
    }
  }

  @Get("my-sections")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ENSEIGNANT)
  async getMySections(@Request() req): Promise<Section[]> {
    const teacherId = toNumberId(req.user.userId);
    return this.enseignantService.getSectionsResponsable(teacherId);
  }

  @Get(":teacherId/sections/:sectionId/students")
  async getStudentsForSection(
    @Param("teacherId") teacherId: string,
    @Param("sectionId") sectionId: string
  ): Promise<Etudiant[]> {
    return this.enseignantService.getStudentsForTeacherSection(
      toNumberId(teacherId),
      sectionId
    );
  }

  @Get(":id/sections-responsable")
  async getSectionsResponsable(@Param("id") id: string): Promise<Section[]> {
    return this.enseignantService.getSectionsResponsable(toNumberId(id));
  }

  @Get(":id/students")
  async getStudents(@Param("id") id: string): Promise<Etudiant[]> {
    return this.enseignantService.getStudentsForTeacher(toNumberId(id));
  }

  @Get(":id/schedules")
  async getSchedules(@Param("id") id: string): Promise<Schedule[]> {
    return this.enseignantService.getSchedules(toNumberId(id));
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Enseignant> {
    return this.enseignantService.findOne(toNumberId(id));
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateEnseignantDto: UpdateEnseignantDto
  ): Promise<Enseignant> {
    return this.enseignantService.update(toNumberId(id), updateEnseignantDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    return this.enseignantService.remove(toNumberId(id));
  }

  @Get("group-change-requests/:requestId")
  async getGroupChangeRequestById(
    @Request() req,
    @Param("requestId") requestId: string,
    @Query("token") token: string
  ) {
    try {
      // Allow authentication via query parameter token or Authorization header
      let teacherId;

      // First check if token is provided in query parameters
      if (token) {
        try {
          // Import JWT service to verify the token
          const jwtService = new JwtService({
            secret: process.env.JWT_SECRET || "secretKey",
          });

          // Verify and decode the token
          const decoded = jwtService.verify(token);
          teacherId = decoded.userId;
        } catch (error) {
          throw new UnauthorizedException(
            "Invalid token provided in query parameter"
          );
        }
      } else {
        // Fall back to req.user from JwtAuthGuard
        teacherId = req.user?.userId;

        if (!teacherId) {
          throw new UnauthorizedException("Authentication required");
        }
      }

      // Retrieve request with document metadata
      const request = await this.enseignantService.getChangeRequestWithMetadata(
        teacherId,
        requestId
      );

      return {
        id: request.id,
        documentName: request.documentName,
        documentMimeType: request.documentMimeType,
        hasDocument: !!request.documentName || !!request.documentPath,
        // Don't include the actual document data in this response
        createdAt: request.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ForbiddenException) {
        throw error;
      } else if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new BadRequestException(
          `Error retrieving request metadata: ${error.message}`
        );
      }
    }
  }
}
