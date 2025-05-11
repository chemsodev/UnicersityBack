import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    TableInheritance,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm';
import { Notification } from './notifications/notification.entity';

export enum AdminRole {
    CHEF_DE_DEPARTEMENT = 'chef-de-departement',
    CHEF_DE_SPECIALITE = 'chef-de-specialite',
    DOYEN = 'doyen',
    VICE_DOYEN = 'vice-doyen',
    SECRETAIRE = 'secretaire',
    ETUDIANT = 'etudiant',
    ENSEIGNANT = 'enseignant',
}


@Entity({ name: 'users' })
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class User {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ length: 100 })
    firstName: string;

    @Column({ length: 100 })
    lastName: string;

    @Column({ length: 100, unique: true })
    email: string;

    @Column({ select: false })
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({
        type: 'enum',
        enum: AdminRole,
        nullable: true,
    })
    adminRole?: AdminRole;

    @OneToMany(() => Notification, notification => notification.user)
    notifications: Notification[];
}