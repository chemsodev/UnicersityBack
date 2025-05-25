import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Section } from "../section/section.entity";
import { Department } from "./departments.entity";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepository.create(createDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async findAll(): Promise<Department[]> {
    return await this.departmentRepository.find({
      relations: ["sections"],
    });
  }
  async findOne(id: number): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ["sections"],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }
  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto
  ): Promise<Department> {
    const department = await this.departmentRepository.preload({
      id,
      ...updateDepartmentDto,
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return this.departmentRepository.save(department);
  }

  async remove(id: number): Promise<void> {
    const result = await this.departmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
  }

  async getDepartmentSections(id: number): Promise<Section[]> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ["sections"],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department.sections;
  }

  async addSectionToDepartment(
    departmentId: number,
    sectionId: string
  ): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
      relations: ["sections"],
    });
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`
      );
    }

    const section = await this.sectionRepository.findOneBy({ id: sectionId });
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    if (!department.sections) {
      department.sections = [];
    }

    // Check if section already exists in department
    const sectionExists = department.sections.some((s) => s.id === sectionId);
    if (!sectionExists) {
      department.sections.push(section);
      return this.departmentRepository.save(department);
    }

    return department;
  }

  async removeSectionFromDepartment(
    departmentId: number,
    sectionId: string
  ): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
      relations: ["sections"],
    });
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`
      );
    }

    department.sections = department.sections.filter(
      (section) => section.id !== sectionId
    );
    return this.departmentRepository.save(department);
  }
}
