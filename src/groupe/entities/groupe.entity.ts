import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Section } from '../../section/section.entity';
import { ChangeRequest } from '../../change-request/change-request.entity';
import { User } from '../../user.entity';

@Entity()
export class Groupe {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    etudiants: User[];
}