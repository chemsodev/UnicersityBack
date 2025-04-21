// src/groupe/groupe.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GroupeService } from './groupe.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminRole } from '../user.entity';
import { RolesGuard } from 'src/roles/roles.guard';
import { Roles } from 'src/roles/roles.decorator';
import { GroupeType } from './groupe.entity';
import { CreateGroupeDto } from './dto/create-groupe.dto';
import { UpdateGroupeDto } from './dto/update-groupe.dto';

@Controller('groupes')
@UseGuards(AuthGuard)
export class GroupeController {
    constructor(private readonly groupeService: GroupeService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
    create(@Body() createGroupeDto: CreateGroupeDto) {
        return this.groupeService.create(createGroupeDto);
    }

    @Get()
    findAll() {
        return this.groupeService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.groupeService.findOne(id);
    }

    @Get('section/:sectionId')
    findBySection(@Param('sectionId') sectionId: string) {
        return this.groupeService.findBySection(sectionId);
    }

    @Get('type/:type')
    findByType(@Param('type') type: GroupeType) {
        return this.groupeService.findByType(type);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
    update(@Param('id') id: string, @Body() updateGroupeDto: UpdateGroupeDto) {
        return this.groupeService.update(id, updateGroupeDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
    remove(@Param('id') id: string) {
        return this.groupeService.remove(id);
    }
}