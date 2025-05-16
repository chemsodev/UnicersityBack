import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SectionService } from "./section/section.service";
import { GroupeService } from "./groupe/groupe.service";
import { EtudiantService } from "./etudiant/etudiant.service";

/**
 * Script to fix student with ID 1549 by assigning them to a section and group
 */
async function bootstrap() {
  try {
    // Initialize NestJS app to access services
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get services
    const sectionService = app.get(SectionService);
    const groupeService = app.get(GroupeService);
    const etudiantService = app.get(EtudiantService);

    const studentId = "1549";

    console.log(`Starting fix for student ${studentId}`);

    // 1. Find the student
    const student = await etudiantService.findOne(studentId);
    console.log(`Found student: ${student.firstName} ${student.lastName}`);

    // 2. Find a section (get the first one for example)
    const sections = await sectionService.findAll();
    if (!sections || sections.length === 0) {
      console.error("No sections found in the database!");
      await app.close();
      return;
    }

    const section = sections[0];
    console.log(`Selected section: ${section.name} (${section.specialty})`);

    // 3. Assign student to section
    console.log("Assigning student to section...");
    await sectionService.assignStudentToSection(section.id, studentId);
    console.log("Student assigned to section successfully");

    // 4. Find TD and TP groups for this section
    const sectionGroups = await sectionService.findGroups(section.id);
    const tdGroup = sectionGroups.find((group) => group.type === "td");
    const tpGroup = sectionGroups.find((group) => group.type === "tp");

    if (!tdGroup) {
      console.error("No TD group found for this section");
    } else {
      // 5. Assign student to TD group
      console.log(`Assigning student to TD group: ${tdGroup.name}`);
      await groupeService.assignStudentToGroup(studentId, tdGroup.id);
      console.log("Student assigned to TD group successfully");
    }

    // 6. Verify the changes
    const updatedStudent = await etudiantService.findOne(studentId);
    console.log("Updated student data:");
    console.log(
      `- Sections: ${
        updatedStudent.sections.map((s) => s.name).join(", ") || "None"
      }`
    );
    console.log(`- TD Group: ${updatedStudent.tdGroupe?.name || "None"}`);
    console.log(`- TP Group: ${updatedStudent.tpGroupe?.name || "None"}`);

    console.log("Fix completed successfully!");

    // Close the app context when done
    await app.close();
  } catch (error) {
    console.error("Error fixing student:", error);
    process.exit(1);
  }
}

bootstrap();
