import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Note } from 'src/notes/notes.entity';
import { Section } from '../section/section.entity';

@Entity('study_modules')
export class StudyModule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    code: string;

    @Column()
    coefficient: number;

    @Column()
    credits: number;

    @ManyToMany(() => Enseignant, enseignant => enseignant.modules)
    @JoinTable({
        name: 'module_enseignants',
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
    sections: Section[];

    @OneToMany(() => Note, (note) => note.module)
    notesReleve: Note[];
}