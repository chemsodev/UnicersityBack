import { Department } from 'src/departments/departments.entity';
import { Etudiant } from 'src/etudiant/etudiant.entity';
import { StudyModule } from 'src/modules/modules.entity';
import { Schedule } from 'src/schedules/schedules.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, OneToMany } from 'typeorm';

@Entity({ name: 'sections' })
export class Section {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    specialty: string;

    @Column({ length: 50 })
    level: string;

    @Column({ length: 20 })
    code: string;

    @ManyToOne(() => Department, (dept) => dept.sections)
    department: Department;

    @ManyToMany(() => Etudiant, (etudiant) => etudiant.sections)
    etudiants: Etudiant[];

    @ManyToMany(() => StudyModule, (module) => module.sections)
    modules: StudyModule[];

    @OneToMany(() => Schedule, (sched) => sched.section)
    emplois: Schedule[];
}