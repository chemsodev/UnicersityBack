// src/section/section.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { SectionService } from './section.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { AdminRole } from '../user.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Controller('sections')
@UseGuards(JwtAuthGuard)
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  create(@Body() createSectionDto: CreateSectionDto, @Request() req) {
    return this.sectionService.create(createSectionDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('level') level?: string,
    @Query('specialty') specialty?: string
  ) {
    return this.sectionService.findAll(departmentId, level, specialty);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sectionService.findOne(id);
  }

  @Get(':id/etudiants')
  findStudents(@Param('id') id: string) {
    return this.sectionService.findStudents(id);
  }

  @Get(':id/groupes')
  findGroups(@Param('id') id: string) {
    return this.sectionService.findGroups(id);
  }

  @Get(':id/modules')
  findModules(@Param('id') id: string) {
    return this.sectionService.findModules(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto, @Request() req) {
    return this.sectionService.update(id, updateSectionDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  remove(@Param('id') id: string) {
    return this.sectionService.remove(id);
  }
}