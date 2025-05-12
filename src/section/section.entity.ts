import { ChangeRequest } from '../change-request/change-request.entity';
import { Department } from '../departments/departments.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Groupe } from '../groupe/groupe.entity';
import { StudyModule } from '../modules/modules.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, OneToMany, JoinTable } from 'typeorm';

@Entity({ name: 'sections' })
export class Section {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @OneToMany(() => Groupe, groupe => groupe.section)
    groupes: Groupe[];

    @OneToMany(() => ChangeRequest, request => request.currentSection)
    changeRequestsFrom: ChangeRequest[];

    @OneToMany(() => ChangeRequest, request => request.requestedSection)
    changeRequestsTo: ChangeRequest[];

    @Column({ length: 100 })
    specialty: string;

    @Column({ length: 50 })
    level: string;

    @Column({ length: 20 })
    code: string;

    @ManyToOne(() => Department, (dept) => dept.sections)
    department: Department;

    @ManyToMany(() => Etudiant, etudiant => etudiant.sections)
    @JoinTable({
        name: 'etudiant_sections',
        joinColumn: {
            name: 'section_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'etudiant_id',
            referencedColumnName: 'id'
        }
    })
    etudiants: Etudiant[];

    @ManyToMany(() => StudyModule, module => module.sections)
    @JoinTable({
        name: 'module_sections',
        joinColumn: {
            name: 'section_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'module_id',
            referencedColumnName: 'id'
        }
    })
    modules: StudyModule[];

    @OneToMany(() => Schedule, schedule => schedule.section)
    schedules: Schedule[];
}