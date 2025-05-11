import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Schedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column()
    room: string;

    @Column()
    imageUrl: string;

    @Column()
    title: string;

    @Column()
    semester: string;
}
