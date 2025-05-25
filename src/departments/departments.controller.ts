import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from "@nestjs/common";
import { DepartmentService } from "./departments.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { Department } from "./departments.entity";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { Section } from "src/section/section.entity";

@Controller("departments")
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto
  ): Promise<Department> {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  async findAll(): Promise<Department[]> {
    return this.departmentService.findAll();
  }
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Department> {
    return this.departmentService.findOne(+id);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto
  ): Promise<Department> {
    return this.departmentService.update(+id, updateDepartmentDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    return this.departmentService.remove(+id);
  }

  @Get(":id/sections")
  async getSections(@Param("id") id: string): Promise<Section[]> {
    return this.departmentService.getDepartmentSections(+id);
  }

  @Post(":departmentId/sections/:sectionId")
  async addSection(
    @Param("departmentId") departmentId: string,
    @Param("sectionId") sectionId: string
  ): Promise<Department> {
    return this.departmentService.addSectionToDepartment(
      +departmentId,
      sectionId
    );
  }
  @Delete(":departmentId/sections/:sectionId")
  async removeSection(
    @Param("departmentId") departmentId: string,
    @Param("sectionId") sectionId: string
  ): Promise<Department> {
    return this.departmentService.removeSectionFromDepartment(
      +departmentId,
      sectionId
    );
  }
}
