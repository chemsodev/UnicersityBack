import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from '../section/section.entity';
import { Department } from './departments.entity';
import { DepartmentController } from './departments.controller';
import { DepartmentService } from './departments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Section])],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule { }