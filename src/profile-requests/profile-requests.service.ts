import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateProfileRequestDto } from "./dto/create-profile-request.dto";
import { UpdateProfileRequestDto } from "./dto/update-profile-request.dto";
import { ProfileRequest, ProfileRequestStatus } from "./profile-request.entity";
import { EtudiantService } from "../etudiant/etudiant.service";

@Injectable()
export class ProfileRequestsService {
  constructor(
    @InjectRepository(ProfileRequest)
    private readonly profileRequestRepo: Repository<ProfileRequest>,
    private readonly etudiantService: EtudiantService
  ) {}

  async create(createProfileRequestDto: CreateProfileRequestDto) {
    // Verify student exists
    await this.etudiantService.findOne(createProfileRequestDto.studentId);

    const newRequest = this.profileRequestRepo.create({
      ...createProfileRequestDto,
      // Map changes to direct fields for backward compatibility
      adresseEmailPersonnelle:
        createProfileRequestDto.changes?.personalEmail ||
        createProfileRequestDto.adresseEmailPersonnelle,
      numeroTelephonePrincipal:
        createProfileRequestDto.changes?.phone ||
        createProfileRequestDto.numeroTelephonePrincipal,
      numeroTelephoneSecondaire:
        createProfileRequestDto.changes?.secondaryPhone ||
        createProfileRequestDto.numeroTelephoneSecondaire,
      adressePostale:
        createProfileRequestDto.changes?.address ||
        createProfileRequestDto.adressePostale,
      codePostal:
        createProfileRequestDto.changes?.postalCode ||
        createProfileRequestDto.codePostal,
      ville:
        createProfileRequestDto.changes?.city || createProfileRequestDto.ville,
      contactEnCasDurgence:
        createProfileRequestDto.changes?.emergencyContact ||
        createProfileRequestDto.contactEnCasDurgence,
    });

    return this.profileRequestRepo.save(newRequest);
  }

  findAll() {
    return this.profileRequestRepo.find({
      relations: ["student"],
      order: { createdAt: "DESC" },
    });
  }

  findByStatus(status: string) {
    return this.profileRequestRepo.find({
      where: { status: status as ProfileRequestStatus },
      relations: ["student"],
      order: { createdAt: "DESC" },
    });
  }

  findByStudent(studentId: string) {
    return this.profileRequestRepo.find({
      where: { studentId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const request = await this.profileRequestRepo.findOne({
      where: { id },
      relations: ["student"],
    });

    if (!request) {
      throw new NotFoundException(`Profile request with ID ${id} not found`);
    }

    return request;
  }

  async update(
    id: string,
    updateProfileRequestDto: UpdateProfileRequestDto & {
      processedById?: string;
    }
  ) {
    const request = await this.findOne(id);

    // If request is being approved, update the student profile
    if (updateProfileRequestDto.status === ProfileRequestStatus.APPROVED) {
      await this.applyProfileChanges(request);
    }

    await this.profileRequestRepo.update(id, updateProfileRequestDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.profileRequestRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Profile request with ID ${id} not found`);
    }
  }
  private async applyProfileChanges(request: ProfileRequest) {
    // Create update object with only the fields that actually exist in the Etudiant/User entities
    const updateData = {};

    // Only update the phone field since it's the only contact field that exists in Etudiant entity
    if (request.numeroTelephonePrincipal !== undefined) {
      updateData["phone"] = request.numeroTelephonePrincipal;
    }

    // Handle new changes object if present
    if (request.changes) {
      if (request.changes.phone) {
        updateData["phone"] = request.changes.phone;
      }
      // Note: Other fields like secondaryPhone, address, postalCode, city, emergencyContact
      // don't exist in the Etudiant entity, so we skip them for now
      // In the future, the Etudiant entity would need to be extended to support these fields
    }

    // Only update if there are changes to apply
    if (Object.keys(updateData).length > 0) {
      await this.etudiantService.update(request.studentId, updateData);
    }
  }
}
