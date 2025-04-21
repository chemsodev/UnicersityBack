import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  MaxLength, 
  Validate, 
  ValidationArguments, 
  ValidatorConstraint, 
  ValidatorConstraintInterface 
} from 'class-validator';

@ValidatorConstraint({ name: 'hasIdentifier', async: false })
export class HasIdentifierConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as LoginDto;
    return !!object.email || !!object.matricule || !!object.id_enseignant;
  }

  defaultMessage() {
    return 'At least one identifier (email, matricule, or teacher ID) must be provided';
  }
}

export class LoginDto {
  @Validate(HasIdentifierConstraint)
  @IsOptional()
  @IsEmail()
  email?: string;

  @Validate(HasIdentifierConstraint)
  @IsOptional()
  @IsString()
  matricule?: string;

  @Validate(HasIdentifierConstraint)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  id_enseignant?: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}