import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Enseignant } from '../../enseignant/enseignant.entity';
import { Etudiant } from '../../etudiant/etudiant.entity';
import { Section } from '../../section/section.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  day: string;

  @Column({ name: 'startTime', type: 'time' })
  startTime: Date;

  @Column({ name: 'endTime', type: 'time' })
  endTime: Date;

  @Column()
  room: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column({ nullable: true })
  sectionId?: string;

  @ManyToOne(() => Enseignant, enseignant => enseignant.schedules)
  @JoinColumn({ name: 'enseignantId' })
  enseignant: Enseignant;

  @Column({ nullable: true })
  enseignantId?: number;

  @ManyToOne(() => Etudiant, etudiant => etudiant.schedules)
  @JoinColumn({ name: 'etudiantId' })
  etudiant: Etudiant;

  @Column({ nullable: true })
  etudiantId?: number;
}