import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  TableInheritance,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Notification } from "./notifications/notification.entity";

export enum AdminRole {
  DOYEN = "doyen", // Highest authority - Supervision générale
  VICE_DOYEN = "vice-doyen", // Second in command - Gestion des admin
  CHEF_DE_DEPARTEMENT = "chef-de-departement", // Department head - Gestion des spécialités, enseignants
  CHEF_DE_SPECIALITE = "chef-de-specialite", // Specialty head - Gestion des étudiants, sections
  SECRETAIRE = "secretaire", // Secretary - Gestion des emplois du temps
  ENSEIGNANT = "enseignant", // Teacher roles remain the same
  ETUDIANT = "etudiant", // Student roles remain the same
}

@Entity({ name: "users" })
@TableInheritance({ column: { type: "varchar", name: "type" } })
export abstract class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: "enum",
    enum: AdminRole,
    nullable: true,
  })
  adminRole?: AdminRole;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
