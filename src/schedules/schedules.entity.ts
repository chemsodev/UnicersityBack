import { Enseignant } from 'src/enseignant/enseignant.entity';
import { Etudiant } from 'src/etudiant/etudiant.entity';
import { StudyModule } from 'src/modules/modules.entity';
import { Section } from 'src/section/section.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';


@Entity({ name: 'schedules' })
export class Schedule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 20 })
    day: string;

    @Column({ type: 'time' })
    startTime: string;

    @Column({ type: 'time' })
    endTime: string;

    @Column({ length: 50 })
    room: string;

    @ManyToOne(() => StudyModule, (module) => module.notesReleve)
    module: StudyModule;

    @ManyToOne(() => Section, (section) => section.emplois)
    section: Section;

    @ManyToOne(() => Enseignant, (enseignant) => enseignant.emplois)
    enseignant: Enseignant;

    @ManyToOne(() => Etudiant, (etudiant) => etudiant.emplois)
    etudiant?: Etudiant;
}