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
      .leftJoinAndSelect("etudiant.schedules", "schedules");

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

  async findOne(id: number | string) {
    // Check if the id is a special string case
    if (id === "with-disability") {
      // Handle the special case for students with disability
      return this.etudiantRepo.find({
        where: { hasDisability: true },
        relations: ["sections", "tdGroupe", "tpGroupe"],
      });
    }

    // For numeric IDs, proceed as before
    const etudiant = await this.etudiantRepo
      .createQueryBuilder("etudiant")
      .leftJoinAndSelect("etudiant.sections", "sections")
      .leftJoinAndSelect("etudiant.tdGroupe", "tdGroupe")
      .leftJoinAndSelect("etudiant.tpGroupe", "tpGroupe")
      .leftJoinAndSelect("etudiant.schedules", "schedules")
      .where("etudiant.id = :id", { id: Number(id) })
      .getOne();

    if (!etudiant) {
      throw new NotFoundException(`Etudiant with ID ${id} not found`);
    }

    return etudiant;
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

  async getSchedules(id: string): Promise<any[]> {
    const entityId = toNumberOrStringId(id);

    const etudiant = await this.etudiantRepo.findOne({
      where: { id: entityId as any },
      relations: ["sections"],
    });

    if (!etudiant) {
      throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
    }

    // Get schedules directly from the section repository since there's an issue
    // with the uploadedById column not existing in the database
    if (!etudiant.sections || etudiant.sections.length === 0) {
      return [];
    }

    // Get section IDs
    const sectionIds = etudiant.sections.map((section) => section.id);

    // Query the schedule repository directly
    try {
      // Get schedules by section ID
      const schedules = await this.etudiantRepo.manager
        .createQueryBuilder(Schedule, "schedule")
        .innerJoin("schedule.section", "section")
        .where("section.id IN (:...sectionIds)", { sectionIds })
        .orderBy("schedule.createdAt", "DESC")
        .getMany();

      return schedules;
    } catch (error) {
      console.error(`Error fetching schedules: ${error.message}`);
      return [];
    }
  }

  async setSectionDelegate(
    etudiantId: string,
    sectionId: string
  ): Promise<Etudiant> {
    // Find the student
    const etudiant = await this.etudiantRepo.findOne({
      where: { id: toNumberOrStringId(etudiantId) as any },
      relations: ["sections"],
    });

    if (!etudiant) {
      throw new NotFoundException(`Student with ID ${etudiantId} not found`);
    }

    // Check if the student belongs to the section
    const belongsToSection =
      etudiant.sections && etudiant.sections.some((s) => s.id === sectionId);
    if (!belongsToSection) {
      throw new ConflictException(
        `Student with ID ${etudiantId} is not part of section ${sectionId}`
      );
    }

    // First, clear any previous section delegates for this section
    await this.etudiantRepo.update(
      { delegateForSection: { id: sectionId as any } },
      { isSectionDelegate: false, delegateForSection: null }
    );

    // Set this student as the section delegate
    etudiant.isSectionDelegate = true;
    etudiant.delegateForSection = { id: sectionId } as any;
    return this.etudiantRepo.save(etudiant);
  }

  async setGroupDelegate(
    etudiantId: string,
    groupId: string,
    groupType: "td" | "tp"
  ): Promise<Etudiant> {
    // Find the student
    const etudiant = await this.etudiantRepo.findOne({
      where: { id: toNumberOrStringId(etudiantId) as any },
      relations: ["tdGroupe", "tpGroupe"],
    });

    if (!etudiant) {
      throw new NotFoundException(`Student with ID ${etudiantId} not found`);
    }

    // Check if the student belongs to the group
    let belongsToGroup = false;
    if (groupType === "td" && etudiant.tdGroupe?.id === groupId) {
      belongsToGroup = true;
    } else if (groupType === "tp" && etudiant.tpGroupe?.id === groupId) {
      belongsToGroup = true;
    }

    if (!belongsToGroup) {
      throw new ConflictException(
        `Student with ID ${etudiantId} is not part of ${groupType} group ${groupId}`
      );
    }

    // First, clear any previous group delegates for this group
    await this.etudiantRepo.update(
      { delegateForGroup: { id: groupId as any } },
      { isGroupDelegate: false, delegateForGroup: null }
    );

    // Set this student as the group delegate
    etudiant.isGroupDelegate = true;
    etudiant.delegateForGroup = { id: groupId } as any;
    return this.etudiantRepo.save(etudiant);
  }

  async removeSectionDelegate(etudiantId: string): Promise<void> {
    // Find the student
    const etudiant = await this.etudiantRepo.findOne({
      where: { id: toNumberOrStringId(etudiantId) as any },
    });

    if (!etudiant) {
      throw new NotFoundException(`Student with ID ${etudiantId} not found`);
    }

    // Remove delegate status
    etudiant.isSectionDelegate = false;
    etudiant.delegateForSection = null;
    await this.etudiantRepo.save(etudiant);
  }

  async removeGroupDelegate(etudiantId: string): Promise<void> {
    // Find the student
    const etudiant = await this.etudiantRepo.findOne({
      where: { id: toNumberOrStringId(etudiantId) as any },
    });

    if (!etudiant) {
      throw new NotFoundException(`Student with ID ${etudiantId} not found`);
    }

    // Remove delegate status
    etudiant.isGroupDelegate = false;
    etudiant.delegateForGroup = null;
    await this.etudiantRepo.save(etudiant);
  }
  async getAllWithDisability(
    page: number = 1,
    limit: number = 10,
    teacherId?: number
  ): Promise<{ students: Etudiant[]; total: number }> {
    // If teacherId is provided, filter students by teacher's sections
    if (teacherId) {
      // Create a query builder to join with sections
      const queryBuilder = this.etudiantRepo
        .createQueryBuilder("etudiant")
        .leftJoinAndSelect("etudiant.sections", "section")
        .leftJoinAndSelect("etudiant.tdGroupe", "tdGroupe")
        .leftJoinAndSelect("etudiant.tpGroupe", "tpGroupe")
        .leftJoin("section.responsables", "responsable")
        .where("etudiant.hasDisability = :hasDisability", {
          hasDisability: true,
        })
        .andWhere("responsable.enseignantId = :teacherId", { teacherId })
        .skip((page - 1) * limit)
        .take(limit);

      const [students, total] = await queryBuilder.getManyAndCount();
      return { students, total };
    }

    // If no teacherId, return all students with disabilities
    const [students, total] = await this.etudiantRepo.findAndCount({
      where: { hasDisability: true },
      skip: (page - 1) * limit,
      take: limit,
      relations: ["sections", "tdGroupe", "tpGroupe"],
    });

    return { students, total };
  }
}
