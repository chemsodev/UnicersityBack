import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  SectionResponsable,
  ResponsableRole,
} from "./section-responsable.entity";
import { Enseignant } from "../enseignant/enseignant.entity";
import { Section } from "./section.entity";

@Injectable()
export class SectionResponsableService {
  constructor(
    @InjectRepository(SectionResponsable)
    private readonly responsableRepo: Repository<SectionResponsable>,
    @InjectRepository(Enseignant)
    private readonly enseignantRepo: Repository<Enseignant>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>
  ) {}

  async assignResponsable(
    sectionId: string,
    enseignantId: number,
    role: ResponsableRole,
    groupId?: number
  ): Promise<SectionResponsable> {
    console.log(
      `Assigning responsable: Section=${sectionId}, Teacher=${enseignantId}, Role=${role}, Group=${groupId}`
    );

    // Validate section exists
    const section = await this.sectionRepo.findOneBy({ id: sectionId });
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Validate enseignant exists
    const enseignant = await this.enseignantRepo.findOneBy({
      id: enseignantId,
    });
    if (!enseignant) {
      throw new NotFoundException(
        `Enseignant with ID ${enseignantId} not found`
      );
    }

    // Check if there's already a responsable with this role for this section
    const existingResponsable = await this.responsableRepo.findOne({
      where: {
        section: { id: sectionId },
        role,
      },
      relations: ["section", "enseignant"],
    });

    if (existingResponsable) {
      // Update the existing assignment
      existingResponsable.enseignant = enseignant;
      existingResponsable.assignedAt = new Date();
      console.log(`Updated existing assignment: ${existingResponsable.id}`);
      return this.responsableRepo.save(existingResponsable);
    } else {
      // Create a new assignment
      const newResponsable = this.responsableRepo.create({
        section: { id: sectionId } as Section,
        enseignant: { id: enseignantId } as Enseignant,
        role,
      });
      console.log(`Creating new assignment for section ${sectionId}`);
      const saved = await this.responsableRepo.save(newResponsable);
      console.log(`Successfully created assignment: ${saved.id}`);
      return saved;
    }
  }

  async assignMultipleResponsables(
    sectionId: string,
    assignments: { enseignantId: string; role: ResponsableRole }[]
  ): Promise<SectionResponsable[]> {
    // Validate section exists
    const section = await this.sectionRepo.findOneBy({ id: sectionId });
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const results: SectionResponsable[] = [];
    for (const assignment of assignments) {
      try {
        const result = await this.assignResponsable(
          sectionId,
          parseInt(assignment.enseignantId),
          assignment.role
        );
        results.push(result);
      } catch (error) {
        // Continue with other assignments even if one fails
        console.error(`Failed to assign responsable: ${error.message}`);
      }
    }
    return results;
  }

  async removeResponsable(
    sectionId: string,
    role: ResponsableRole
  ): Promise<void> {
    // Validate section exists
    const section = await this.sectionRepo.findOneBy({ id: sectionId });
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const result = await this.responsableRepo.delete({
      section: { id: sectionId },
      role,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `No responsable found for section ${sectionId} with role ${role}`
      );
    }
  }

  async removeResponsableById(
    sectionId: string,
    responsableId: string
  ): Promise<void> {
    // Validate section exists
    const section = await this.sectionRepo.findOneBy({ id: sectionId });
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Find the responsable to validate it belongs to the section
    const responsable = await this.responsableRepo.findOne({
      where: {
        id: responsableId,
        section: { id: sectionId },
      },
      relations: ["section", "enseignant"],
    });

    if (!responsable) {
      throw new NotFoundException(
        `Responsable with ID ${responsableId} not found for section ${sectionId}`
      );
    }

    // Delete the responsable
    const result = await this.responsableRepo.delete(responsableId);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Failed to delete responsable with ID ${responsableId}`
      );
    }
  }

  async getResponsablesForSection(
    sectionId: string
  ): Promise<SectionResponsable[]> {
    // Validate section exists
    const section = await this.sectionRepo.findOneBy({ id: sectionId });
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    return this.responsableRepo.find({
      where: {
        section: { id: sectionId },
      },
      relations: ["section", "enseignant"],
    });
  }

  async getResponsablesForEnseignant(
    enseignantId: number
  ): Promise<SectionResponsable[]> {
    // Validate enseignant exists
    const enseignant = await this.enseignantRepo.findOneBy({
      id: enseignantId,
    });
    if (!enseignant) {
      throw new NotFoundException(
        `Enseignant with ID ${enseignantId} not found`
      );
    }

    return this.responsableRepo.find({
      where: {
        enseignant: { id: enseignantId },
      },
      relations: ["section", "enseignant"],
    });
  }
}
