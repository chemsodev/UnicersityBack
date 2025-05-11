import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Enseignant } from '../../enseignant/enseignant.entity';
import { Etudiant } from '../../etudiant/etudiant.entity';
import { Section } from '../../section/section.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  day: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  room: string;

  @Column()
  semester: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column()
  uploadedAt: Date;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column({ nullable: true })
  sectionId?: string;

  @ManyToOne(() => Enseignant, enseignant => enseignant.schedules)
  @JoinColumn({ name: 'enseignantId' })
  enseignant: Enseignant;

  @Column({ nullable: true })
  enseignantId?: string;

  @ManyToOne(() => Etudiant, etudiant => etudiant.schedules)
  @JoinColumn({ name: 'etudiantId' })
  etudiant: Etudiant;

  @Column({ nullable: true })
  etudiantId?: string;
}