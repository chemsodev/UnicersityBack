import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Etudiant } from '../etudiant/etudiant.entity';

export enum ProfileRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity()
export class ProfileRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Etudiant, { onDelete: 'CASCADE' })
  student: Etudiant;

  @Column()
  studentId: string;

  @Column({ nullable: true })
  adresseEmailPersonnelle?: string;

  @Column({ nullable: true })
  numeroTelephonePrincipal?: string;

  @Column({ nullable: true })
  numeroTelephoneSecondaire?: string;

  @Column({ nullable: true })
  adressePostale?: string;

  @Column({ nullable: true })
  codePostal?: string;

  @Column({ nullable: true })
  ville?: string;

  @Column({ nullable: true })
  contactEnCasDurgence?: string;

  @Column({
    type: 'enum',
    enum: ProfileRequestStatus,
    default: ProfileRequestStatus.PENDING
  })
  status: ProfileRequestStatus;

  @Column({ nullable: true })
  adminComment?: string;

  @Column({ nullable: true })
  processedById?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}