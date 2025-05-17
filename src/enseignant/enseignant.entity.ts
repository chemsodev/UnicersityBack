import { StudyModule } from "../modules/modules.entity";
import { Schedule } from "../schedules/entities/schedule.entity";
import { SectionResponsable } from "../section/section-responsable.entity";
import { User } from "../user.entity";
import { ChildEntity, ManyToMany, OneToMany, JoinTable, Column } from "typeorm";

@ChildEntity("enseignant")
export class Enseignant extends User {
  @Column({
    name: "id_enseignant",
    type: "varchar",
    length: 50,
    unique: true,
    nullable: false,
  })
  id_enseignant: string;
  @ManyToMany(() => StudyModule, (module) => module.enseignants)
  @JoinTable({
    name: "enseignant_modules",
    joinColumn: {
      name: "enseignant_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "module_id",
      referencedColumnName: "id",
    },
  })
  modules: StudyModule[];

  @OneToMany(() => Schedule, (schedule) => schedule.uploadedBy)
  schedules: Schedule[];

  @OneToMany(() => SectionResponsable, (responsable) => responsable.enseignant)
  sectionResponsabilites: SectionResponsable[];
}
