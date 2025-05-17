import { Note } from "../notes/notes.entity";
import { Schedule } from "../schedules/entities/schedule.entity";
import { Section } from "../section/section.entity";
import { User } from "../user.entity";
import {
  ChildEntity,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Groupe } from "../groupe/groupe.entity";

@ChildEntity("etudiant")
export class Etudiant extends User {
  @Column({ unique: true, length: 20 })
  matricule: string;

  @Column({ type: "date" })
  birthDate: Date;

  @Column({ length: 10 })
  gender: string;

  @Column({ length: 50 })
  nationality: string;

  @Column({ default: false })
  hasDisability: boolean;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @ManyToMany(() => Section, (section) => section.etudiants)
  @JoinTable({
    name: "etudiant_sections",
    joinColumn: {
      name: "etudiant_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "section_id",
      referencedColumnName: "id",
    },
  })
  sections: Section[];

  @ManyToOne(() => Groupe)
  @JoinColumn({ name: "td_groupe_id" })
  tdGroupe: Groupe;

  @ManyToOne(() => Groupe)
  @JoinColumn({ name: "tp_groupe_id" })
  tpGroupe: Groupe;

  @OneToMany(() => Note, (note) => note.etudiant)
  notesReleve: Note[];

  // Schedule relationship removed - students now access schedules through their section
}
