import { User } from "../user.entity";
import { ChildEntity } from "typeorm";

@ChildEntity("administrateur")
export class Administrateur extends User {}
