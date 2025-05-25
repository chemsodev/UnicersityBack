import { Section } from "../section/section.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity({ name: "departments" })
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ length: 100 })
  headOfDepartment: string;

  @OneToMany(() => Section, (section) => section.department, {
    cascade: true,
  })
  sections: Section[];
}
