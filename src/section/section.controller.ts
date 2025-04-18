// src/section/section.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SectionService } from './section.service';
import { AuthGuard } from '../auth/auth.guard';

import { AdminRole } from '../user.entity';
import { RolesGuard } from 'src/roles/roles.guard';
import { Roles } from 'src/roles/roles.decorator';
import { CreateSectionDto } from './create-section.dto';
import { UpdateSectionDto } from './update-section.dto';

@Controller('sections')
@UseGuards(AuthGuard)
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  create(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionService.create(createSectionDto);
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
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
    return this.sectionService.update(id, updateSectionDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  remove(@Param('id') id: string) {
    return this.sectionService.remove(id);
  }
}