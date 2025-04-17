
import { Enseignant } from 'src/enseignant/enseignant.entity';
import { Note } from 'src/notes/notes.entity';
import { Section } from 'src/section/section.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';

@Entity({ name: 'study_modules' })
export class StudyModule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    title: string;

    @Column({ length: 50 })
    type: string;

    @Column({ type: 'decimal', precision: 3, scale: 2 })
    coefficient: number;

    @ManyToMany(() => Enseignant, (enseignant) => enseignant.modules)
    enseignants: Enseignant[];

    @ManyToMany(() => Section, (section) => section.modules)
    @JoinTable({
        name: 'module_sections',
        joinColumn: { name: 'module_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'section_id', referencedColumnName: 'id' },
    })
    sections: Section[];

    @OneToMany(() => Note, (note) => note.module)
    notesReleve: Note[];
}