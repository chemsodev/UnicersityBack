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
  Res,
  NotFoundException,
  Query,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ChangeRequestService } from "./change-request.service";
import { AuthGuard } from "../auth/auth.guard";
import { AdminRole } from "../user.entity";
import { Roles } from "src/roles/roles.decorator";
import { RolesGuard } from "src/roles/roles.guard";
import { RolesUtil } from "../utils/roles.util";
import {
  CreateChangeRequestDto,
  RequestStatus,
  RequestType,
  UpdateRequestStatusDto,
} from "./change-request.entity";
import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { Express, Response } from "express";
import * as fs from "fs";

@Controller("change-requests")
@UseGuards(AuthGuard)
export class ChangeRequestController {
  constructor(private readonly service: ChangeRequestService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  @UseInterceptors(
    FileInterceptor("document", {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
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
    })
  )
  async createRequest(
    @Request() req,
    @Body() createDto: CreateChangeRequestDto,
    @UploadedFile() document?: Express.Multer.File
  ) {
    // Store file in memory instead of on disk
    const documentData = document ? document.buffer : null;
    const documentName = document ? document.originalname : null;
    const documentMimeType = document ? document.mimetype : null;

    return this.service.createRequest(
      req.user.userId,
      createDto,
      null, // No longer storing paths
      documentData,
      documentName,
      documentMimeType
    );
  }

  @Post("section")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  async createSectionRequest(@Request() req, @Body() body: any) {
    // Create a standard DTO from the section-specific data
    const createDto: CreateChangeRequestDto = {
      requestType: RequestType.SECTION,
      currentId: body.currentSectionId,
      requestedId: body.requestedSectionId,
      justification: body.justification,
    };

    return this.service.createRequest(req.user.userId, createDto);
  }

  @Post("section-with-document")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  @UseInterceptors(
    FileInterceptor("document", {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
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
    })
  )
  async createSectionRequestWithDocument(
    @Request() req,
    @Body() body: any,
    @UploadedFile() document?: Express.Multer.File
  ) {
    console.log("Processing section request with document");

    try {
      // If a JSON data field is provided, parse it
      let sectionData;
      if (body.data && typeof body.data === "string") {
        try {
          sectionData = JSON.parse(body.data);
        } catch (e) {
          throw new BadRequestException("Invalid JSON data format");
        }
      } else {
        sectionData = body;
      }

      // Log the received data
      console.log("Section data:", sectionData);

      // Create a standard DTO from the section-specific data
      const createDto: CreateChangeRequestDto = {
        requestType: RequestType.SECTION,
        currentId: sectionData.currentSectionId,
        requestedId: sectionData.requestedSectionId,
        justification: sectionData.justification,
      };

      // Check if all required fields are present
      if (!createDto.justification) {
        throw new BadRequestException("Justification is required");
      }

      if (!createDto.currentId || !createDto.requestedId) {
        throw new BadRequestException(
          "Current and requested section IDs are required"
        );
      }

      // Store file in memory
      const documentData = document ? document.buffer : null;
      const documentName = document ? document.originalname : null;
      const documentMimeType = document ? document.mimetype : null;

      if (document) {
        console.log(
          `Document received: ${documentName}, ${documentMimeType}, Size: ${documentData.length} bytes`
        );
      }

      return this.service.createRequest(
        req.user.userId,
        createDto,
        null, // No longer storing paths
        documentData,
        documentName,
        documentMimeType
      );
    } catch (error) {
      console.error("Error processing section request with document:", error);
      throw error;
    }
  }

  @Post("group")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  @UseInterceptors(
    FileInterceptor("document", {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
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
    })
  )
  async createGroupRequest(
    @Request() req,
    @Body() body: any,
    @UploadedFile() document?: Express.Multer.File
  ) {
    console.log("Processing group request with document");

    try {
      console.log("Body received:", body);

      // Validate required fields
      if (
        !body.requestType ||
        !body.currentId ||
        !body.requestedId ||
        !body.justification
      ) {
        console.log("Missing required fields:", {
          requestType: body.requestType,
          currentId: body.currentId,
          requestedId: body.requestedId,
          justification: body.justification,
        });
        throw new BadRequestException(
          "Missing required fields for group change request"
        );
      }

      // Ensure the request type matches (both TD or both TP)
      const requestType =
        body.requestType === "groupe_td"
          ? RequestType.GROUPE_TD
          : RequestType.GROUPE_TP;

      // Validate that the current and requested groups match the request type
      if (requestType === RequestType.GROUPE_TD) {
        // For TD group changes, validate current and requested are both TD groups
        const currentGroup = await this.service.getGroupById(body.currentId);
        const requestedGroup = await this.service.getGroupById(
          body.requestedId
        );

        if (!currentGroup || !requestedGroup) {
          throw new BadRequestException(
            "One or both of the specified groups were not found"
          );
        }

        // For TD groups, verify by checking if name contains "TD" or type is 'td'
        const isCurrentTD =
          currentGroup.type === "td" ||
          currentGroup.name.toLowerCase().includes("td");
        const isRequestedTD =
          requestedGroup.type === "td" ||
          requestedGroup.name.toLowerCase().includes("td");

        console.log("TD group validation:", {
          currentGroup: {
            id: currentGroup.id,
            name: currentGroup.name,
            type: currentGroup.type,
            isValid: isCurrentTD,
          },
          requestedGroup: {
            id: requestedGroup.id,
            name: requestedGroup.name,
            type: requestedGroup.type,
            isValid: isRequestedTD,
          },
        });

        if (!isCurrentTD || !isRequestedTD) {
          throw new BadRequestException(
            "Pour un changement de groupe TD, le groupe actuel et le groupe demandé doivent être des groupes TD"
          );
        }
      } else if (requestType === RequestType.GROUPE_TP) {
        // For TP group changes, validate current and requested are both TP groups
        const currentGroup = await this.service.getGroupById(body.currentId);
        const requestedGroup = await this.service.getGroupById(
          body.requestedId
        );

        if (!currentGroup || !requestedGroup) {
          throw new BadRequestException(
            "One or both of the specified groups were not found"
          );
        }

        // For TP groups, check either database type or name contains "TP" due to data inconsistency
        const isCurrentTP =
          currentGroup.type === "tp" ||
          currentGroup.name.toLowerCase().includes("tp");
        const isRequestedTP =
          requestedGroup.type === "tp" ||
          requestedGroup.name.toLowerCase().includes("tp");

        console.log("TP group validation:", {
          currentGroup: {
            id: currentGroup.id,
            name: currentGroup.name,
            type: currentGroup.type,
            isValid: isCurrentTP,
          },
          requestedGroup: {
            id: requestedGroup.id,
            name: requestedGroup.name,
            type: requestedGroup.type,
            isValid: isRequestedTP,
          },
        });

        if (!isCurrentTP || !isRequestedTP) {
          throw new BadRequestException(
            "Pour un changement de groupe TP, le groupe actuel et le groupe demandé doivent être des groupes TP"
          );
        }
      }

      // Store file in memory instead of on disk
      const documentData = document ? document.buffer : null;
      const documentName = document ? document.originalname : null;
      const documentMimeType = document ? document.mimetype : null;

      console.log("Parsed request type:", requestType);

      const createDto: CreateChangeRequestDto = {
        requestType,
        currentId: body.currentId,
        requestedId: body.requestedId,
        justification: body.justification,
      };

      console.log("Created DTO:", createDto);

      if (document) {
        console.log(
          `Document received: ${documentName}, ${documentMimeType}, Size: ${documentData.length} bytes`
        );
      }

      return this.service.createRequest(
        req.user.userId,
        createDto,
        null,
        documentData,
        documentName,
        documentMimeType
      );
    } catch (error) {
      console.error("Error processing group request:", error);
      throw error;
    }
  }

  @Get("my-requests")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.ETUDIANT)
  async getMyRequests(@Request() req) {
    return this.service.getStudentRequests(req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(...RolesUtil.getAdminRoles())
  async getAllRequests() {
    return this.service.findAll();
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(...RolesUtil.getAdminRoles())
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
    }; // Make sure the request belongs to the current user
    return this.service.cancelStudentRequest(req.user.userId, id, updateDto);
  }

  @Get("section")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE
  )
  async getSectionChangeRequests(
    @Query("status") status?: RequestStatus,
    @Query("departmentId") departmentId?: string
  ) {
    return this.service.findSectionChangeRequests(status, departmentId);
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

  @Get(":id/document")
  async getRequestDocument(@Param("id") id: string, @Res() res: Response) {
    try {
      const request = await this.service.getRequestWithDocument(id);

      if (!request) {
        throw new NotFoundException("Request not found");
      }

      // Check if document data exists and has actual content
      if (!request.documentData || request.documentData.length === 0) {
        console.log(`No document found for request ${id}`);

        // Return a 204 No Content response instead of an error
        return res.status(204).send();
      }

      console.log(
        `Serving document: ${request.documentName}, ${request.documentMimeType}, Size: ${request.documentData.length} bytes`
      );

      // Check if we need to set a fallback MIME type based on file extension
      let mimeType = request.documentMimeType || "application/octet-stream";

      if (!mimeType || mimeType === "application/octet-stream") {
        if (request.documentName) {
          const extension = request.documentName
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
              case "gif":
                mimeType = "image/gif";
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

      // Enable caching for better performance
      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${
          request.documentName || "document"
        }"`,
        "Content-Length": request.documentData.length,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        ETag: `"${id}"`,
      });

      // Send the binary data directly to the client
      return res.send(request.documentData);
    } catch (error) {
      console.error("Error retrieving document:", error);
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new BadRequestException(
          `Failed to retrieve document: ${error.message}`
        );
      }
    }
  }
  @Get(":id/document")
  @UseGuards(AuthGuard)
  async downloadDocument(@Param("id") id: string, @Res() res: any) {
    const document = await this.service.getRequestDocument(id);

    // Set the appropriate headers for file download
    res.setHeader("Content-Type", document.mimetype);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(document.filename)}`
    ); // Send the document data
    return res.send(document.data);
  }
}
