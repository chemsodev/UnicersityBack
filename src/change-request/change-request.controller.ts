// src/change-request/change-request.controller.ts
import { Controller, Post, Get, Patch, Body, Param, UseGuards, UploadedFile, UseInterceptors, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangeRequestService } from './change-request.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminRole } from '../user.entity';
import { Roles } from 'src/roles/roles.decorator';
import { RolesGuard } from 'src/roles/roles.guard';
import { CreateChangeRequestDto, UpdateRequestStatusDto } from './change-request.entity';

@Controller('change-requests')
@UseGuards(AuthGuard)
export class ChangeRequestController {
    constructor(private readonly service: ChangeRequestService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(AdminRole.ETUDIANT)
    @UseInterceptors(FileInterceptor('document'))
    async createRequest(
        @Request() req,
        @Body() createDto: CreateChangeRequestDto,
        @UploadedFile() document: Express.Multer.File
    ) {
        const documentPath = `/uploads/${document.originalname}`;
        return this.service.createRequest(req.user.userId, createDto, documentPath);
    }

    @Get('my-requests')
    async getMyRequests(@Request() req) {
        return this.service.getStudentRequests(req.user.userId);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
    async getAllRequests() {
        return this.service.getAllRequests();
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
    async updateRequestStatus(
        @Param('id') id: string,
        @Body() updateDto: UpdateRequestStatusDto
    ) {
        return this.service.updateRequestStatus(id, updateDto);
    }
}