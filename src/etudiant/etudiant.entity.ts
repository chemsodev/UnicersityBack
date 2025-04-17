// etudiant.entity.ts
import { Note } from 'src/notes/notes.entity';
import { Schedule } from 'src/schedules/schedules.entity';
import { Section } from 'src/section/section.entity';
import { User } from 'src/user.entity';
import { ChildEntity, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';

@ChildEntity('etudiant')
export class Etudiant extends User {
    @Column({ unique: true, length: 20 })
    matricule: string;

    @Column({ type: 'date' })
    birthDate: Date;

    @Column({ length: 10 })
    gender: string;

    @Column({ length: 50 })
    nationality: string;

    @Column({ default: false })
    hasDisability: boolean;

    @Column({ length: 20, nullable: true })
    phone?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @ManyToMany(() => Section, section => section.etudiants)
    @JoinTable({
        name: 'etudiant_sections',
        joinColumn: {
            name: 'etudiant_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'section_id',
            referencedColumnName: 'id'
        }
    })
    sections: Section[];

    @OneToMany(() => Note, (note) => note.etudiant)
    notesReleve: Note[];

    @OneToMany(() => Schedule, (sched) => sched.etudiant)
    emplois: Schedule[];
}