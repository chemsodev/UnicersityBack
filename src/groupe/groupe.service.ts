import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Groupe, GroupeType } from "./groupe.entity";
import { Repository, In } from "typeorm";
import { Section } from "src/section/section.entity";
import { CreateGroupeDto } from "./dto/create-groupe.dto";
import { UpdateGroupeDto } from "./dto/update-groupe.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/notification.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { toNumberOrStringId } from "../utils/id-conversion.util";

@Injectable()
export class GroupeService {
  constructor(
    @InjectRepository(Groupe)
    private readonly groupeRepo: Repository<Groupe>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>,
    private readonly notificationsService: NotificationsService
  ) {}

  async findAvailableGroups(
    type: string,
    sectionId?: string
  ): Promise<Groupe[]> {
    // Make sure the type is valid
    const groupeType =
      type === "td" ? GroupeType.TD : type === "tp" ? GroupeType.TP : null;

    if (!groupeType) {
      throw new BadRequestException(
        `Invalid group type: ${type}. Must be 'td' or 'tp'`
      );
    }

    const query = this.groupeRepo
      .createQueryBuilder("groupe")
      .where("groupe.type = :type", { type: groupeType })
      .andWhere("groupe.currentOccupancy < groupe.capacity");

    if (sectionId) {
      query.andWhere("groupe.section = :sectionId", { sectionId });
    }

    return query.getMany();
  }

  async create(createDto: CreateGroupeDto): Promise<Groupe> {
    const section = await this.sectionRepo.findOneBy({
      id: createDto.sectionId,
    });
    if (!section) {
      throw new NotFoundException(
        `Section with ID ${createDto.sectionId} not found`
      );
    }

    const groupe = new Groupe();
    groupe.name = createDto.name;
    groupe.type = createDto.type;
    groupe.section = section;
    groupe.capacity = createDto.capacity;
    groupe.currentOccupancy = 0;

    return this.groupeRepo.save(groupe);
  }

  async findAll(): Promise<Groupe[]> {
    return this.groupeRepo.find({
      relations: ["section", "etudiantsTD", "etudiantsTP"],
    });
  }

  async findOne(id: string): Promise<Groupe> {
    const groupe = await this.groupeRepo.findOne({
      where: { id },
      relations: ["section", "etudiantsTD", "etudiantsTP"],
    });

    if (!groupe) {
      throw new NotFoundException(`Groupe with ID ${id} not found`);
    }

    return groupe;
  }

  async findBySection(sectionId: string): Promise<Groupe[]> {
    return this.groupeRepo.find({
      where: { section: { id: sectionId } },
      relations: ["section"],
    });
  }

  async findByType(type: GroupeType): Promise<Groupe[]> {
    try {
      console.log(`Finding groups with type: ${type}`);
      return this.groupeRepo.find({
        where: { type },
        relations: ["section"],
      });
    } catch (error) {
      console.error(`Error finding groups by type: ${error.message}`);
      throw new BadRequestException(`Error finding groups: ${error.message}`);
    }
  }

  async update(id: string, updateDto: UpdateGroupeDto): Promise<Groupe> {
    const groupe = await this.findOne(id);

    if (updateDto.name) {
      groupe.name = updateDto.name;
    }

    if (updateDto.type) {
      groupe.type = updateDto.type;
    }

    if (updateDto.capacity) {
      if (updateDto.capacity < groupe.currentOccupancy) {
        throw new BadRequestException(
          "New capacity cannot be less than current occupancy"
        );
      }
      groupe.capacity = updateDto.capacity;
    }

    if (updateDto.sectionId) {
      const section = await this.sectionRepo.findOneBy({
        id: updateDto.sectionId,
      });
      if (!section) {
        throw new NotFoundException(
          `Section with ID ${updateDto.sectionId} not found`
        );
      }
      groupe.section = section;
    }

    return this.groupeRepo.save(groupe);
  }

  async remove(id: string): Promise<void> {
    const groupe = await this.findOne(id);

    if (groupe.currentOccupancy > 0) {
      throw new BadRequestException(
        "Cannot delete group with assigned students"
      );
    }

    await this.groupeRepo.remove(groupe);
  }

  async assignStudentToGroup(
    studentId: string,
    groupId: string
  ): Promise<Groupe> {
    const entityId = toNumberOrStringId(studentId);

    const student = await this.etudiantRepo.findOne({
      where: { id: entityId as any },
      relations: ["tdGroupe", "tpGroupe"],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const groupe = await this.findOne(groupId);

    if (groupe.currentOccupancy >= groupe.capacity) {
      throw new BadRequestException("Group is at full capacity");
    }

    // Check the group type (TD or TP) and assign accordingly
    if (groupe.type === GroupeType.TD) {
      // If student is already in this TD group, nothing to do
      if (student.tdGroupe && student.tdGroupe.id === groupe.id) {
        return groupe;
      }

      // If student is in another TD group, decrement that group's occupancy
      if (student.tdGroupe) {
        const oldGroup = await this.findOne(student.tdGroupe.id);
        oldGroup.currentOccupancy--;
        await this.groupeRepo.save(oldGroup);
      }

      // Update student's TD group
      student.tdGroupe = groupe;
    } else if (groupe.type === GroupeType.TP) {
      // If student is already in this TP group, nothing to do
      if (student.tpGroupe && student.tpGroupe.id === groupe.id) {
        return groupe;
      }

      // If student is in another TP group, decrement that group's occupancy
      if (student.tpGroupe) {
        const oldGroup = await this.findOne(student.tpGroupe.id);
        oldGroup.currentOccupancy--;
        await this.groupeRepo.save(oldGroup);
      }

      // Update student's TP group
      student.tpGroupe = groupe;
    }

    await this.etudiantRepo.save(student);

    // Update group occupancy
    groupe.currentOccupancy++;
    return this.groupeRepo.save(groupe);
  }

  async removeStudentFromGroup(
    studentId: string,
    groupId: string
  ): Promise<Groupe> {
    const entityId = toNumberOrStringId(studentId);

    const student = await this.etudiantRepo.findOne({
      where: { id: entityId as any },
      relations: ["tdGroupe", "tpGroupe"],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const groupe = await this.findOne(groupId);

    // Check which type of group the student is in
    if (groupe.type === GroupeType.TD) {
      // If student is not in this TD group, nothing to do
      if (!student.tdGroupe || student.tdGroupe.id !== groupe.id) {
        throw new BadRequestException(
          "Student is not assigned to this TD group"
        );
      }
      // Remove student from TD group
      student.tdGroupe = null;
    } else if (groupe.type === GroupeType.TP) {
      // If student is not in this TP group, nothing to do
      if (!student.tpGroupe || student.tpGroupe.id !== groupe.id) {
        throw new BadRequestException(
          "Student is not assigned to this TP group"
        );
      }
      // Remove student from TP group
      student.tpGroupe = null;
    }

    await this.etudiantRepo.save(student);

    // Update group occupancy
    groupe.currentOccupancy--;
    return this.groupeRepo.save(groupe);
  }

  async checkGroupAvailability(groupId: string): Promise<{
    available: boolean;
    currentOccupancy: number;
    capacity: number;
  }> {
    const group = await this.groupeRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException("Groupe non trouvé");
    }

    return {
      available: group.currentOccupancy < group.capacity,
      currentOccupancy: group.currentOccupancy,
      capacity: group.capacity,
    };
  }
}
