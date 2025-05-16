import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { ScheduleService } from "./schedules.service";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";
import { Schedule } from "./entities/schedule.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";

@Controller("schedules")
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async create(
    @Body() createScheduleDto: CreateScheduleDto
  ): Promise<Schedule> {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  async findAll(): Promise<Schedule[]> {
    return this.scheduleService.findAll();
  }

  @Get("section/:sectionId")
  async getSchedulesBySection(
    @Param("sectionId") sectionId: string
  ): Promise<Schedule[]> {
    return this.scheduleService.getSchedulesBySection(sectionId);
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<Schedule> {
    return this.scheduleService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateScheduleDto: UpdateScheduleDto
  ): Promise<Schedule> {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.scheduleService.remove(id);
  }
}
