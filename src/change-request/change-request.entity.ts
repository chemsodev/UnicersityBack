// src/change-request/change-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Section } from "../section/section.entity";
import { Groupe } from "../groupe/groupe.entity";
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
} from "class-validator";

export enum RequestType {
  SECTION = "section",
  GROUPE_TP = "groupe_tp",
  GROUPE_TD = "groupe_td",
}

export enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

@Entity()
export class ChangeRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Etudiant)
  etudiant: Etudiant;

  @Column({
    type: "enum",
    enum: RequestType,
  })
  requestType: RequestType;

  @ManyToOne(() => Section, { nullable: true })
  currentSection?: Section;

  @ManyToOne(() => Section, { nullable: true })
  requestedSection?: Section;

  // For group changes
  @ManyToOne(() => Groupe, { nullable: true })
  currentGroupe?: Groupe;

  @ManyToOne(() => Groupe, { nullable: true })
  requestedGroupe?: Groupe;

  @Column("text")
  justification: string;

  @Column({ type: 'bytea', name: 'document_data', nullable: true })
  documentData?: Buffer;

  @Column({ name: 'document_name', nullable: true })
  documentName?: string;

  @Column({ name: 'document_mime_type', nullable: true })
  documentMimeType?: string;

  @Column({ nullable: true })
  documentPath: string;

  @Column({
    type: "enum",
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  responseMessage?: string;

  @Column({ unique: true })
  requestNumber: string;

  @Column()
  studentId: string;
}

export class CreateChangeRequestDto {
  @IsEnum(RequestType)
  @IsNotEmpty()
  requestType: RequestType;

  @IsString()
  @IsNotEmpty()
  currentId: string;

  @IsString()
  @IsNotEmpty()
  requestedId: string;

  @IsString()
  @IsNotEmpty()
  justification: string;
}

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsString()
  @IsOptional()
  responseMessage?: string;
}
