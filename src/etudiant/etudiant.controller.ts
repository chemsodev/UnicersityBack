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
} from '@nestjs/common';
import { EtudiantService } from './etudiant.service';
import { CreateEtudiantDto, UpdateEtudiantDto } from './create-etudiant.dto';
import { Etudiant } from './etudiant.entity';
import { AuthGuard } from '../auth/auth.guard';
import { AdminRole } from '../user.entity';
import { RolesGuard } from 'src/roles/roles.guard';
import { Roles } from 'src/roles/roles.decorator';

@Controller('etudiants')
@UseGuards(AuthGuard)
export class EtudiantController {
    constructor(private readonly etudiantService: EtudiantService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.AGENT)
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createEtudiantDto: CreateEtudiantDto) {
        return this.etudiantService.create(createEtudiantDto);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.AGENT, AdminRole.CHEF_DE_DEPARTEMENT)
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query('search') search?: string
    ) {
        return this.etudiantService.findAll(page, limit, search);
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    async findOne(@Param('id') id: string, @Request() req) {
        if (req.user.userType === 'etudiant' && req.user.userId !== id) {
            throw new UnauthorizedException('Vous ne pouvez voir que votre propre profil');
        }
        return this.etudiantService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.AGENT)
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(
        @Param('id') id: string,
        @Body() updateEtudiantDto: UpdateEtudiantDto
    ): Promise<Etudiant> {
        return await this.etudiantService.update(id, updateEtudiantDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.SECRETAIRE, AdminRole.DOYEN)
    async remove(@Param('id') id: string): Promise<void> {
        await this.etudiantService.remove(id);
    }

    @Get(':id/notes')
    @UseGuards(RolesGuard)
    async getNotes(
        @Param('id') id: string,
        @Request() req
    ) {
        if (req.user.userType === 'etudiant' && req.user.userId !== id) {
            throw new UnauthorizedException('Vous ne pouvez voir que vos propres notes');
        }
        return this.etudiantService.getStudentNotes(id);
    }

    @Get(':id/emplois')
    @UseGuards(RolesGuard)
    async getSchedule(
        @Param('id') id: string,
        @Request() req
    ) {
        // Students can only view their own schedule
        if (req.user.userType === 'etudiant' && req.user.userId !== id) {
            throw new UnauthorizedException('Vous ne pouvez voir que votre propre emploi du temps');
        }
        // Teachers and admins can view any student's schedule
        return this.etudiantService.getStudentSchedule(id);
    }
}