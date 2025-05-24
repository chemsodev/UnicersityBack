import { PartialType } from "@nestjs/mapped-types";
import { CreateEnseignantDto } from "./create-enseignant.dto";

export class UpdateEnseignantDto extends PartialType(CreateEnseignantDto) {}
