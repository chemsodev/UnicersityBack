import { ChangeRequest } from "../change-request/change-request.entity";
import { Department } from "../departments/departments.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Groupe } from "../groupe/groupe.entity";
import { Schedule } from "../schedules/entities/schedule.entity";
import { SectionResponsable } from "./section-responsable.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
} from "typeorm";

@Entity({ name: "sections" })
export class Section {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ default: 100 })
  capacity: number;

  @OneToMany(() => Groupe, (groupe) => groupe.section)
  groupes: Groupe[];

  @OneToMany(() => ChangeRequest, (request) => request.currentSection)
  changeRequestsFrom: ChangeRequest[];

  @OneToMany(() => ChangeRequest, (request) => request.requestedSection)
  changeRequestsTo: ChangeRequest[];

  @Column({ length: 100 })
  specialty: string;

  @Column({ length: 50 })
  level: string;

  @Column({ length: 20 })
  code: string;

  @ManyToOne(() => Department, (dept) => dept.sections, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "department_id" })
  department: Department;

  @Column({ name: "department_id", type: "integer", nullable: false })
  departmentId: number;

  @ManyToMany(() => Etudiant, (etudiant) => etudiant.sections)
  @JoinTable({
    name: "etudiant_sections",
    joinColumn: {
      name: "section_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "etudiant_id",
      referencedColumnName: "id",
    },
  })
  etudiants: Etudiant[];

  @OneToMany(() => Schedule, (schedule) => schedule.section)
  schedules: Schedule[];

  @OneToMany(() => SectionResponsable, (responsable) => responsable.section)
  responsables: SectionResponsable[];
}
