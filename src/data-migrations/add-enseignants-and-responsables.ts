import { DataSource } from "typeorm";
import { ResponsableRole } from "../section/section-responsable.entity";

/**
 * Migration to add enseignants and assign them as section responsables
 */
export async function addEnseignantsAndResponsables(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // Check if the enseignants already exist
    console.log("Checking if the enseignants already exist...");
    const bensaadExists = await queryRunner.query(
      `SELECT COUNT(*) as count FROM users WHERE "lastName" = 'BENSAAD' AND "firstName" = 'Mohammed'`
    );
    if (bensaadExists[0].count > 0) {
      console.log("Enseignants already exist, skipping creation");
      return;
    }

    // Add new enseignants
    console.log("Adding new enseignants...");
    const enseignantsResult = await queryRunner.query(`
      INSERT INTO public.users (
        "firstName", "lastName", email, password, "adminRole", matricule, "birthDate", gender, nationality, "hasDisability", phone, type
      ) VALUES
        ('Mohammed', 'BENSAAD', 'mohammed.bensaad@enseignant.com', '$2a$06$CNd3wOi.F61BHdMGGy30VeciFhj5x.alSy7QMRhS6YkOwMDC1tOqu', 'enseignant', 'DR001', '1975-05-15', 'male', 'Algerian', false, '0550001122', 'enseignant'),
        ('Ahmed', 'RAHMANI', 'ahmed.rahmani@enseignant.com', '$2a$06$CNd3wOi.F61BHdMGGy30VeciFhj5x.alSy7QMRhS6YkOwMDC1tOqu', 'enseignant', 'DR002', '1978-03-20', 'male', 'Algerian', false, '0550002233', 'enseignant'),
        ('Karim', 'MEZIANI', 'karim.meziani@enseignant.com', '$2a$06$CNd3wOi.F61BHdMGGy30VeciFhj5x.alSy7QMRhS6YkOwMDC1tOqu', 'enseignant', 'DR003', '1980-07-10', 'male', 'Algerian', false, '0550003344', 'enseignant'),
        ('Samira', 'TALEB', 'samira.taleb@enseignant.com', '$2a$06$CNd3wOi.F61BHdMGGy30VeciFhj5x.alSy7QMRhS6YkOwMDC1tOqu', 'enseignant', 'DR004', '1982-11-25', 'female', 'Algerian', false, '0550004455', 'enseignant')
      RETURNING id, "firstName", "lastName"
    `);

    console.log("Enseignants added:", enseignantsResult);

    // Get the IDs of the newly added enseignants
    const bensaadId = enseignantsResult[0].id;
    const rahmaniId = enseignantsResult[1].id;
    const mezianiId = enseignantsResult[2].id;
    const talebId = enseignantsResult[3].id;

    // Check if SSI M2 section exists
    const ssiM2Section = await queryRunner.query(
      `SELECT id, name FROM sections WHERE id = 'c0489afc-9a27-4c9c-b00a-a343503b29cd'`
    );

    if (ssiM2Section.length === 0) {
      console.error(
        "SSI M2 section not found. Please assign to a valid section."
      );
      return;
    }

    console.log(
      `Found section: ${ssiM2Section[0].name} (${ssiM2Section[0].id})`
    );

    // Assign responsables to SSI M2 section
    console.log("Assigning responsables...");

    // First, create responsable_role enum type if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'responsablerole') THEN
          CREATE TYPE responsablerole AS ENUM ('filiere', 'section', 'td', 'tp');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      INSERT INTO section_responsables (role, "sectionId", "enseignantId")
      VALUES
        ('filiere', 'c0489afc-9a27-4c9c-b00a-a343503b29cd', '${bensaadId}'),
        ('section', 'c0489afc-9a27-4c9c-b00a-a343503b29cd', '${rahmaniId}'),
        ('td', 'c0489afc-9a27-4c9c-b00a-a343503b29cd', '${mezianiId}'),
        ('tp', 'c0489afc-9a27-4c9c-b00a-a343503b29cd', '${talebId}')
    `);

    console.log("Responsables assigned successfully");
  } catch (error) {
    console.error("Error adding enseignants and responsables:", error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
