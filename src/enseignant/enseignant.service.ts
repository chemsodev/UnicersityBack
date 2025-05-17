import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Enseignant } from "./enseignant.entity";
import { StudyModule } from "../modules/modules.entity";
import { Schedule } from "../schedules/entities/schedule.entity";
import { CreateEnseignantDto } from "./dto/create-enseignant.dto";
import { AssignModulesDto } from "./dto/assign-modules.dto";
import { UpdateEnseignantDto } from "./dto/update-enseignant.dto";

@Injectable()
export class EnseignantService {
  constructor(
    @InjectRepository(Enseignant)
    private readonly enseignantRepository: Repository<Enseignant>,
    @InjectRepository(StudyModule)
    private readonly moduleRepository: Repository<StudyModule>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>
  ) {}

  async create(createEnseignantDto: CreateEnseignantDto): Promise<Enseignant> {
    const enseignant = this.enseignantRepository.create(createEnseignantDto);
    return await this.enseignantRepository.save(enseignant);
  }

  async findAll(): Promise<Enseignant[]> {
    return this.enseignantRepository.find({
      relations: ["modules", "schedules"],
    });
  }

  async findOne(id: number): Promise<Enseignant> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id },
      relations: ["modules", "schedules"],
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }

    return enseignant;
  }

  async findByIdEnseignant(idEnseignant: string): Promise<Enseignant> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id_enseignant: idEnseignant },
      relations: ["modules", "schedules"],
    });

    if (!enseignant) {
      throw new NotFoundException(
        `Enseignant with ID ${idEnseignant} not found`
      );
    }

    return enseignant;
  }

  async update(
    id: number,
    updateEnseignantDto: UpdateEnseignantDto
  ): Promise<Enseignant> {
    const enseignant = await this.findOne(id);

    // Update the fields
    Object.assign(enseignant, updateEnseignantDto);

    // Save the updated enseignant
    return this.enseignantRepository.save(enseignant);
  }

  async remove(id: number): Promise<void> {
    const result = await this.enseignantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }
  }

  async assignModules(
    id: number,
    assignModulesDto: AssignModulesDto
  ): Promise<Enseignant> {
    const enseignant = await this.findOne(id);
    const modules: StudyModule[] = [];

    for (const moduleId of assignModulesDto.moduleIds) {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      modules.push(module);
    }

    enseignant.modules = modules;
    return this.enseignantRepository.save(enseignant);
  }

  async getSchedules(id: number): Promise<Schedule[]> {
    const enseignant = await this.findOne(id);
    return this.scheduleRepository.find({
      where: { enseignant: { id } },
      relations: ["section"],
    });
  }

  async getModules(id: number): Promise<StudyModule[]> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id },
      relations: ["modules"],
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }

    return enseignant.modules;
  }
}
