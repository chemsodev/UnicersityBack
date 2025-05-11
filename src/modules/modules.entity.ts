import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Note } from 'src/notes/notes.entity';
import { Section } from '../section/section.entity';

@Entity('study_modules')
export class StudyModule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'title' })
    name: string;

    @Column({ name: 'type' })
    code: string;

    @Column({ type: 'numeric', precision: 3, scale: 2 })
    coefficient: number;

    @Column({ name: 'credits', nullable: true })
    credits?: number;

    @ManyToMany(() => Enseignant, enseignant => enseignant.modules)
    @JoinTable({
        name: 'enseignant_modules',
        joinColumn: {
            name: 'module_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'enseignant_id',
            referencedColumnName: 'id'
        }
    })
    enseignants: Enseignant[];

    @ManyToMany(() => Section, section => section.modules)
    @JoinTable({
        name: 'module_sections',
        joinColumn: {
            name: 'module_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'section_id',
            referencedColumnName: 'id'
        }
    })
    sections: Section[];

    @OneToMany(() => Note, (note) => note.module)
    notesReleve: Note[];
}