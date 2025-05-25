import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Enseignant } from "../../enseignant/enseignant.entity";
import { Section } from "../../section/section.entity";

export enum ScheduleType {
  REGULAR = "regular", // Regular weekly schedule
  EXAM = "exam", // Exam schedule
  SPECIAL = "special", // Special events
}

@Entity("schedules")
export class Schedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ScheduleType,
    default: ScheduleType.REGULAR,
  })
  scheduleType: ScheduleType;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "bytea", name: "document_data", nullable: true })
  documentData: Buffer;

  @Column({ name: "document_name", nullable: true })
  documentName: string;

  @Column({ name: "document_mime_type", nullable: true })
  documentMimeType: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: "sectionId" })
  section: Section;

  @Column({ nullable: true })
  sectionId: string;

  @ManyToOne(() => Enseignant)
  @JoinColumn({ name: "uploadedById" })
  uploadedBy: Enseignant;

  @Column({ nullable: true })
  uploadedById: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  academicYear: string;

  @Column({ nullable: true })
  semester: string;

  @Column({ nullable: true })
  weekNumber: number;

  @Column({ type: "time", nullable: true })
  startTime: string;

  @Column({ type: "time", nullable: true })
  endTime: string;

  @Column({ nullable: true })
  day: string;

  @Column({ nullable: true })
  room: string;
}
