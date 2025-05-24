import { Schedule } from "../schedules/entities/schedule.entity";
import { SectionResponsable } from "../section/section-responsable.entity";
import { User } from "../user.entity";
import { ChildEntity, OneToMany, Column } from "typeorm";

@ChildEntity("enseignant")
export class Enseignant extends User {
  @Column({ unique: true, length: 20, nullable: true })
  matricule: string;

  @OneToMany(() => Schedule, (schedule) => schedule.uploadedBy)
  schedules: Schedule[];

  @OneToMany(() => SectionResponsable, (responsable) => responsable.enseignant)
  sectionResponsabilites: SectionResponsable[];
}
