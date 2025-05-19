import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "../user.entity";

export enum NotificationType {
  ADMIN = "admin",
  COURS = "cours",
  EXAMEN = "examen",
  EMPLOI_DU_TEMPS = "emploi_du_temps",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.ADMIN,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column()
  userId: number;
  @Column({ nullable: true })
  actionLink?: string;

  @Column({ nullable: true })
  actionLabel?: string;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>;
}
