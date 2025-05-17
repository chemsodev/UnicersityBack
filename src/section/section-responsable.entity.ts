import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
} from "typeorm";
import { Section } from "./section.entity";
import { Enseignant } from "../enseignant/enseignant.entity";

export enum ResponsableRole {
  FILIERE = "filiere",
  SECTION = "section",
  TD = "td",
  TP = "tp",
}

@Entity({ name: "section_responsables" })
export class SectionResponsable {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Section, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "sectionId" })
  section: Section;

  @Column({ type: "uuid" })
  sectionId: string;

  @ManyToOne(() => Enseignant, { nullable: false })
  @JoinColumn({ name: "enseignantId" })
  enseignant: Enseignant;

  @Column()
  enseignantId: number;

  @Column({
    type: "enum",
    enum: ResponsableRole,
    default: ResponsableRole.SECTION,
  })
  role: ResponsableRole;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  assignedAt: Date;
}
