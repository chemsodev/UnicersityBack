import { AppDataSource } from "../data-source";

/**
 * Create a default department if none exists
 */
async function createDefaultDepartment() {
  try {
    await AppDataSource.initialize();
    console.log("Data source initialized successfully.");

    // Check if departments table exists and has any data
    const existingDepartments = await AppDataSource.query(
      "SELECT * FROM departments LIMIT 1"
    );

    if (existingDepartments.length === 0) {
      console.log("No departments found, creating default department...");

      // Insert a default department
      await AppDataSource.query(`
        INSERT INTO departments (name, description, "headOfDepartment")
        VALUES ('Informatique', 'Département d''Informatique', 'Dr. Mohamed BENALI')
      `);

      console.log("Default department created successfully.");
    } else {
      console.log("Department(s) already exist:", existingDepartments);
    }

    // Show all departments
    const allDepartments = await AppDataSource.query(
      "SELECT * FROM departments"
    );
    console.log("All departments:", allDepartments);
  } catch (error) {
    console.error("Error creating default department:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Data source connection closed.");
    }
  }
}

// Run the script
createDefaultDepartment();
