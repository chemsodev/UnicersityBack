import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Etudiant } from "./etudiant.entity";
import { Repository, Like } from "typeorm";
import {
  CreateEtudiantDto,
  UpdateEtudiantDto,
} from "./dto/create-etudiant.dto";
import { Schedule } from "../schedules/entities/schedule.entity";
import { Groupe } from "../groupe/groupe.entity";
import { toNumberOrStringId } from "../utils/id-conversion.util";

@Injectable()
export class EtudiantService {
  constructor(
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<Etudiant[]> {
    const skip = (page - 1) * limit;
    const query = this.etudiantRepo
      .createQueryBuilder("etudiant")
      .leftJoinAndSelect("etudiant.sections", "sections")
      .leftJoinAndSelect("etudiant.notesReleve", "notesReleve")
      .leftJoinAndSelect("etudiant.schedules", "schedules")
      .take(limit)
      .skip(skip);

    if (search) {
      query.where([
        { firstName: Like(`%${search}%`) },
        { lastName: Like(`%${search}%`) },
        { matricule: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
      ]);
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Etudiant> {
    // First attempt: try to load both TD and TP groups
    try {
      const etudiant = await this.etudiantRepo
        .createQueryBuilder("etudiant")
        .leftJoinAndSelect("etudiant.sections", "sections")
        .leftJoinAndSelect("etudiant.notesReleve", "notesReleve")
        .leftJoinAndSelect(
          "etudiant.schedules",
          "schedules",
          "schedules.etudiantId = etudiant.id"
        )
        .leftJoinAndSelect("etudiant.tdGroupe", "tdGroupe")
        .leftJoinAndSelect("etudiant.tpGroupe", "tpGroupe")
        .leftJoinAndSelect("sections.department", "department")
        .leftJoinAndSelect("sections.groupes", "groupes")
        .where("etudiant.id = :id", { id })
        .andWhere("etudiant.type = :type", { type: "etudiant" })
        .getOne();

      if (!etudiant) {
        throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
      }

      // Manually get TD and TP groups for this student's section
      if (etudiant.sections && etudiant.sections.length > 0) {
        const sectionId = etudiant.sections[0].id;

        // Get all groups for this section
        const groups = await this.etudiantRepo.manager
          .createQueryBuilder(Groupe, "groupe")
          .leftJoinAndSelect("groupe.section", "section")
          .where("section.id = :sectionId", { sectionId })
          .getMany();

        // Attach groups to sections
        if (groups && groups.length > 0) {
          etudiant.sections[0].groupes = groups;
        }
      }

      return etudiant;
    } catch (error) {
      console.error("Error loading student data:", error);
      throw error;
    }
  }

  async create(createEtudiantDto: CreateEtudiantDto): Promise<Etudiant> {
    // Check if matricule already exists
    const existingMatricule = await this.etudiantRepo.findOne({
      where: { matricule: createEtudiantDto.matricule },
    });

    if (existingMatricule) {
      throw new ConflictException("Un étudiant avec ce matricule existe déjà");
    }

    // Check if email already exists
    const existingEmail = await this.etudiantRepo.findOne({
      where: { email: createEtudiantDto.email },
    });

    if (existingEmail) {
      throw new ConflictException("Un étudiant avec cet email existe déjà");
    }

    try {
      const newEtudiant = this.etudiantRepo.create(createEtudiantDto);
      return await this.etudiantRepo.save(newEtudiant);
    } catch (error) {
      if (error.code === "23505") {
        throw new ConflictException("Données dupliquées");
      }
      throw new InternalServerErrorException(
        "Échec de la création de l'étudiant"
      );
    }
  }

  async update(
    id: string,
    updateEtudiantDto: UpdateEtudiantDto
  ): Promise<Etudiant> {
    // Convert to appropriate ID type (TypeORM decides whether to use string or number)
    const entityId = toNumberOrStringId(id);

    const existingEtudiant = await this.etudiantRepo.findOne({
      where: { id: entityId as any },
    });

    if (!existingEtudiant) {
      throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
    }

    // Check for duplicate matricule if it's being updated
    if (
      updateEtudiantDto.matricule &&
      updateEtudiantDto.matricule !== existingEtudiant.matricule
    ) {
      const matriculeExists = await this.etudiantRepo.findOne({
        where: { matricule: updateEtudiantDto.matricule },
      });
      if (matriculeExists) {
        throw new ConflictException(
          "Un étudiant avec ce matricule existe déjà"
        );
      }
    }

    // Check for duplicate email if it's being updated
    if (
      updateEtudiantDto.email &&
      updateEtudiantDto.email !== existingEtudiant.email
    ) {
      const emailExists = await this.etudiantRepo.findOne({
        where: { email: updateEtudiantDto.email },
      });
      if (emailExists) {
        throw new ConflictException("Un étudiant avec cet email existe déjà");
      }
    }

    try {
      await this.etudiantRepo.update(entityId, updateEtudiantDto);
      const updatedEtudiant = await this.etudiantRepo
        .createQueryBuilder("etudiant")
        .leftJoinAndSelect("etudiant.sections", "sections")
        .leftJoinAndSelect("etudiant.notesReleve", "notesReleve")
        .leftJoinAndSelect("etudiant.schedules", "schedules")
        .where("etudiant.id = :id", { id: entityId })
        .getOne();

      if (!updatedEtudiant) {
        throw new InternalServerErrorException(
          "Échec de la récupération de l'étudiant mis à jour"
        );
      }

      return updatedEtudiant;
    } catch (error) {
      if (error.code === "23505") {
        throw new ConflictException("Données dupliquées");
      }
      throw new InternalServerErrorException(
        "Échec de la mise à jour de l'étudiant"
      );
    }
  }

  async remove(id: string): Promise<void> {
    const entityId = toNumberOrStringId(id);
    const result = await this.etudiantRepo.delete(entityId);

    if (result.affected === 0) {
      throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
    }
  }

  async getStudentNotes(id: string) {
    const entityId = toNumberOrStringId(id);
    const etudiant = await this.etudiantRepo.findOne({
      where: { id: entityId as any },
      relations: ["notesReleve"],
    });

    if (!etudiant) {
      throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
    }

    return etudiant.notesReleve;
  }

  async getSchedules(id: string): Promise<Schedule[]> {
    const entityId = toNumberOrStringId(id);
    const etudiant = await this.etudiantRepo.findOne({
      where: { id: entityId as any },
      relations: ["schedules"],
    });
    if (!etudiant) {
      throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
    }
    return etudiant.schedules;
  }
}
