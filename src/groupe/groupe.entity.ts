// src/groupe/groupe.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Section } from "../section/section.entity";
import { ChangeRequest } from "../change-request/change-request.entity";
import { Etudiant } from "../etudiant/etudiant.entity";

export enum GroupeType {
  TD = "td",
  TP = "tp",
}

@Entity()
export class Groupe {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: GroupeType,
  })
  type: GroupeType;

  @ManyToOne(() => Section, (section) => section.groupes)
  section: Section;

  @Column()
  capacity: number;

  @Column({ default: 0 })
  currentOccupancy: number;

  @OneToMany(() => ChangeRequest, (request) => request.currentGroupe)
  changeRequestsFrom: ChangeRequest[];

  @OneToMany(() => ChangeRequest, (request) => request.requestedGroupe)
  changeRequestsTo: ChangeRequest[];

  @OneToMany(() => Etudiant, (etudiant) => etudiant.tdGroupe)
  etudiantsTD: Etudiant[];

  @OneToMany(() => Etudiant, (etudiant) => etudiant.tpGroupe)
  etudiantsTP: Etudiant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
