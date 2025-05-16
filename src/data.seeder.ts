// src/data.seeder.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Section } from "./section/section.entity";
import { Groupe, GroupeType } from "./groupe/groupe.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class DataSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(Groupe)
    private readonly groupeRepo: Repository<Groupe>
  ) {}

  async onModuleInit() {
    console.log("Checking for existing data...");

    // Check if we already have sections in the database
    const sectionCount = await this.sectionRepo.count();
    if (sectionCount === 0) {
      console.log("No sections found. Seeding database...");
      await this.seedData();
    } else {
      console.log(`Found ${sectionCount} existing sections. Skipping seed.`);
    }
  }

  async seedData() {
    try {
      // Create sections
      const sectionA = await this.createSection(
        "A",
        "Computer Science",
        "L1",
        "CS-L1-A"
      );
      const sectionB = await this.createSection(
        "B",
        "Computer Science",
        "L1",
        "CS-L1-B"
      );
      const sectionC = await this.createSection(
        "C",
        "Computer Science",
        "L1",
        "CS-L1-C"
      );

      // Create TD groups for each section
      await this.createGroups(sectionA, GroupeType.TD, 5);
      await this.createGroups(sectionB, GroupeType.TD, 5);
      await this.createGroups(sectionC, GroupeType.TD, 5);

      // Create TP groups for each section
      await this.createGroups(sectionA, GroupeType.TP, 8);
      await this.createGroups(sectionB, GroupeType.TP, 8);
      await this.createGroups(sectionC, GroupeType.TP, 8);

      console.log("Data seeding completed successfully!");
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  private async createSection(
    name: string,
    specialty: string,
    level: string,
    code: string
  ): Promise<Section> {
    const section = new Section();
    section.name = name;
    section.specialty = specialty;
    section.level = level;
    section.code = code;
    return this.sectionRepo.save(section);
  }

  private async createGroups(
    section: Section,
    type: GroupeType,
    count: number
  ): Promise<void> {
    const groupPrefix = type === GroupeType.TD ? "TD" : "TP";

    for (let i = 1; i <= count; i++) {
      const group = new Groupe();
      group.name = `${groupPrefix}${section.name}${i}`;
      group.type = type;
      group.section = section;
      group.capacity = type === GroupeType.TD ? 30 : 20; // TD groups can hold 30, TP groups 20
      group.currentOccupancy = 0;

      await this.groupeRepo.save(group);
    }
  }
}
