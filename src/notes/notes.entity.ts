import { Etudiant } from "../etudiant/etudiant.entity";
import { StudyModule } from "../modules/modules.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

@Entity({ name: "notes" })
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  value: number;

  @ManyToOne(() => Etudiant, (etudiant) => etudiant.notesReleve)
  etudiant: Etudiant;

  @ManyToOne(() => StudyModule, (module) => module.notesReleve)
  module: StudyModule;
}
