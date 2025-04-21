
import { StudyModule } from 'src/modules/modules.entity';
import { Schedule } from 'src/schedules/schedules.entity';
import { User } from 'src/user.entity';
import { ChildEntity, ManyToMany, OneToMany, JoinTable,Column } from 'typeorm';


@ChildEntity('enseignant')
export class Enseignant extends User {
    @Column({ 
        name: 'id_enseignant',
        type: 'varchar',
        length: 50,
        unique: true,
        nullable: false 
    })
    id_enseignant: string;
    @ManyToMany(() => StudyModule, module => module.enseignants)
    @JoinTable({
        name: 'enseignant_modules',
        joinColumn: {
            name: 'enseignant_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'module_id',
            referencedColumnName: 'id'
        }
    })
    modules: StudyModule[];

    @OneToMany(() => Schedule, (sched) => sched.enseignant)
    emplois: Schedule[];
}