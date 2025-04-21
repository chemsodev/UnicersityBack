import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
} from '@nestjs/common';
import { EnseignantService } from './enseignant.service';
import { CreateEnseignantDto } from './dto/create-enseignant.dto';
import { Enseignant } from './enseignant.entity';
import { UpdateEnseignantDto } from './dto/update-enseignant.dto';
import { AssignModulesDto } from './dto/assign-modules.dto';
import { Schedule } from 'src/schedules/schedules.entity';
import { StudyModule } from 'src/modules/modules.entity';

@Controller('enseignants')
export class EnseignantController {
    constructor(private readonly enseignantService: EnseignantService) { }

    @Post()
    async create(@Body() createEnseignantDto: CreateEnseignantDto): Promise<Enseignant> {
        return this.enseignantService.create(createEnseignantDto);
    }

    @Get()
    async findAll(): Promise<Enseignant[]> {
        return this.enseignantService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Enseignant> {
        return this.enseignantService.findOne(id);
    }

    @Get('by-id/:idEnseignant')
    async findByIdEnseignant(@Param('idEnseignant') idEnseignant: string): Promise<Enseignant> {
        return this.enseignantService.findByIdEnseignant(idEnseignant);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateEnseignantDto: UpdateEnseignantDto,
    ): Promise<Enseignant> {
        return this.enseignantService.update(id, updateEnseignantDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.enseignantService.remove(id);
    }

    @Post(':id/assign-modules')
    async assignModules(
        @Param('id') id: string,
        @Body() assignModulesDto: AssignModulesDto,
    ): Promise<Enseignant> {
        return this.enseignantService.assignModules(id, assignModulesDto);
    }

    @Get(':id/schedules')
    async getSchedules(@Param('id') id: string): Promise<Schedule[]> {
        return this.enseignantService.getSchedules(id);
    }

    @Get(':id/modules')
    async getModules(@Param('id') id: string): Promise<StudyModule[]> {
        return this.enseignantService.getModules(id);
    }
}