import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Request,
  UnauthorizedException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { EtudiantService } from "./etudiant.service";
import {
  CreateEtudiantDto,
  UpdateEtudiantDto,
} from "./dto/create-etudiant.dto";
import { Etudiant } from "./etudiant.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminRole } from "../user.entity";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { NotificationsService } from "../notifications/notifications.service";
import { ScheduleService } from "../schedules/schedules.service";
import { ModuleRef } from "@nestjs/core";
import { EnseignantService } from "../enseignant/enseignant.service";

@Controller("etudiants")
@UseGuards(JwtAuthGuard)
export class EtudiantController {
  constructor(
    private readonly etudiantService: EtudiantService,
    private readonly notificationsService: NotificationsService,
    private readonly moduleRef: ModuleRef,
    private readonly enseignantService: EnseignantService
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createEtudiantDto: CreateEtudiantDto) {
    return this.etudiantService.create(createEtudiantDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT, AdminRole.ENSEIGNANT)
  async findAll(
    @Request() req,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query("search") search?: string
  ) {
    const user = req.user;

    if (!user || !user.adminRole) {
      throw new UnauthorizedException("User role not defined.");
    }

    if (user.adminRole === AdminRole.ENSEIGNANT) {
      if (!user.userId) {
        throw new UnauthorizedException("User ID not found for teacher.");
      }
      const teacherId = parseInt(user.userId, 10); 
      if (isNaN(teacherId)) {
        throw new BadRequestException("Invalid teacher ID format.");
      }
      return this.enseignantService.getStudentsForTeacher(teacherId, page, limit, search);
    } else if (
      user.adminRole === AdminRole.SECRETAIRE ||
      user.adminRole === AdminRole.CHEF_DE_DEPARTEMENT
  ) {
    return this.etudiantService.findAll(page, limit, search);
    } else {
      throw new UnauthorizedException("Insufficient permissions to view student list.");
    }
  }

  @Get("timetable")
  async getTimetable(@Request() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException("Utilisateur non authentifié");
      }

      const studentId = req.user.userId;
      
      // Get student data with section info
      const student = await this.etudiantService.findOne(studentId);
      
      if (!student || !student.sections || student.sections.length === 0) {
        return { message: "Aucun emploi du temps disponible - étudiant sans section" };
      }
      
      // Get the student's first section
      const sectionId = student.sections[0].id;
      
      try {
        // Get the latest schedule for the student's section
        const scheduleService = this.moduleRef.get(ScheduleService, { strict: false });
        const latestSchedule = await scheduleService.findLatestBySection(sectionId);
        
        return {
          id: latestSchedule.id,
          title: latestSchedule.title,
          scheduleType: latestSchedule.scheduleType,
          description: latestSchedule.description,
          documentName: latestSchedule.documentName,
          documentUrl: `/api/schedules/${latestSchedule.id}/document`,
          createdAt: latestSchedule.createdAt,
          updatedAt: latestSchedule.updatedAt,
          section: latestSchedule.section,
          academicYear: latestSchedule.academicYear,
          semester: latestSchedule.semester
        };
      } catch (error) {
        console.log("No schedule found for section:", error.message);
        return { 
          message: "Aucun emploi du temps disponible pour votre section", 
          sectionId 
        };
      }
    } catch (error) {
      console.error("Error loading timetable:", error);
      if (error instanceof NotFoundException) {
        return { message: "Aucun emploi du temps disponible" };
      }
      throw error;
    }
  }

  @Post("timetable")
  @UseInterceptors(
    FileInterceptor("timetable", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), "uploads", "timetables");
          // Create directory if it doesn't exist
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req: any, file, cb) => {
          // Use student ID as prefix for the filename
          if (!req.user) {
            return cb(new BadRequestException("User not authenticated"), "");
          }

          // Clean the original filename
          const originalName = file.originalname.replace(/\s+/g, "_");
          // Use the user id
          const userId = req.user.userId || "unknown";
          const filename = `${userId}-${originalName}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allow only image files and PDFs
        const allowedMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "application/pdf",
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException("Only image files and PDFs are allowed"),
            false
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
    })
  )
  async uploadTimetable(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    return {
      fileUrl: `/uploads/timetables/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      fileType: file.mimetype,
    };
  }

  @Delete("timetable")
  async deleteTimetable(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException("User not authenticated");
    }

    const studentId = req.user.userId;
    const uploadDir = path.join(process.cwd(), "uploads", "timetables");

    try {
      const files = fs.readdirSync(uploadDir);
      const studentFile = files.find((f) => f.startsWith(`${studentId}-`));

      if (studentFile) {
        fs.unlinkSync(path.join(uploadDir, studentFile));
        return { message: "Timetable deleted successfully" };
      } else {
        throw new NotFoundException("No timetable found for this student");
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        "Error deleting timetable: " + error.message
      );
    }
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  async findOne(@Param("id") id: string, @Request() req) {
    // More comprehensive debug logging
    console.log("findOne student profile request:", {
      requestedId: id,
      user: req.user,
      requestPath: req.path,
      authHeader: req.headers?.authorization ? 'Present' : 'Missing'
    });

    // Handle numeric conversion - some IDs may be stored as numbers in one place and strings in another
    let userIdString = String(req.user.userId || '');
    let idString = String(id || '');
    
    // Try also as number
    const userIdNum = parseInt(userIdString, 10);
    const idNum = parseInt(idString, 10);
    
    // If both are valid numbers and they're equal numerically, consider them a match
    const numericMatch = !isNaN(userIdNum) && !isNaN(idNum) && userIdNum === idNum;
    // Direct string match
    const stringMatch = userIdString === idString;
    
    // Check if user is a student by either adminRole or userType
    const isStudent = req.user.adminRole === "etudiant" || req.user.userType === "etudiant";
    
    // Non-students (admin users) can view any profile
    if (!isStudent) {
      console.log("Admin access granted: non-student user accessing profile");
      return this.etudiantService.findOne(id);
    }
    
    // Students can only view their own profiles
    if (!stringMatch && !numericMatch) {
      console.log("Access denied: student attempting to view another profile", {
        studentId: userIdString,
        numericStudentId: userIdNum,
        attemptingToView: idString,
        numericRequestedId: idNum,
        stringMatch,
        numericMatch
      });
      throw new UnauthorizedException(
        "Vous ne pouvez voir que votre propre profil"
      );
    }
    
    console.log("Access granted: student viewing own profile", {
      stringMatch,
      numericMatch
    });
    return this.etudiantService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param("id") id: string,
    @Body() updateEtudiantDto: UpdateEtudiantDto
  ): Promise<Etudiant> {
    return await this.etudiantService.update(id, updateEtudiantDto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.DOYEN)
  async remove(@Param("id") id: string): Promise<void> {
    await this.etudiantService.remove(id);
  }

  @Get(":id/notes")
  @UseGuards(RolesGuard)
  async getNotes(@Param("id") id: string, @Request() req) {
    if (req.user.adminRole === "etudiant" && req.user.userId !== id) {
      throw new UnauthorizedException(
        "Vous ne pouvez voir que vos propres notes"
      );
    }
    return this.etudiantService.getStudentNotes(id);
  }

  @Get(":id/schedule")
  @UseGuards(RolesGuard)
  async getSchedule(@Param("id") id: string, @Request() req) {
    if (req.user.adminRole === "etudiant" && req.user.userId !== id) {
      throw new UnauthorizedException(
        "Vous ne pouvez voir que votre propre emploi du temps"
      );
    }
    return this.etudiantService.getSchedules(id);
  }

  @Get(":id/notifications")
  async getNotifications(@Param("id") id: string) {
    return this.notificationsService.findAllForUser(id);
  }
}
