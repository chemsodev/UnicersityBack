import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddResponseMessageToChangeRequestTIMESTAMP
  implements MigrationInterface
{
  // Replace TIMESTAMP with the actual timestamp generated in your filename

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "change_request",
      new TableColumn({
        name: "responseMessage",
        type: "text", // Use 'varchar' or other type if more appropriate
        isNullable: true, // Match the entity definition
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("change_request", "responseMessage");
  }
}
