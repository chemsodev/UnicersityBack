import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    Query,
} from '@nestjs/common';
import { Administrateur } from './administrateur.entity';
import { CreateAdministrateurDto } from './dto/create-administrateur.dto';
import { UpdateAdministrateurDto } from './dto/update-administrateur.dto';
import { AdministrateurService } from './administrateur.service';

@Controller('administrateurs')
export class AdministrateurController {
    constructor(private readonly administrateurService: AdministrateurService) { }

    @Post()
    async create(@Body() createAdministrateurDto: CreateAdministrateurDto): Promise<Administrateur> {
        return this.administrateurService.create(createAdministrateurDto);
    }

    @Get()
    async findAll(): Promise<Administrateur[]> {
        return this.administrateurService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Administrateur> {
        return this.administrateurService.findOne(id);
    }

    @Get('by-email/:email')
    async findByEmail(@Param('email') email: string): Promise<Administrateur> {
        return this.administrateurService.findByEmail(email);
    }

    @Get('by-role/:role')
    async findByRole(@Param('role') role: string): Promise<Administrateur[]> {
        return this.administrateurService.getAdminsByRole(role);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateAdministrateurDto: UpdateAdministrateurDto,
    ): Promise<Administrateur> {
        return this.administrateurService.update(id, updateAdministrateurDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.administrateurService.remove(id);
    }
}