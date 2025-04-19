// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Administrateur } from '../administrateur/administrateur.entity';
import { LoginDto } from './dto/login.dto';
import { AdminRole } from '../user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>,
    @InjectRepository(Enseignant)
    private readonly enseignantRepo: Repository<Enseignant>,
    @InjectRepository(Administrateur)
    private readonly adminRepo: Repository<Administrateur>,
    private readonly jwtService: JwtService,
  ) { }

  private async validateUser(
    repo: Repository<any>,
    dto: LoginDto,
    isAdmin: boolean = false
  ) {
    const selectFields = ['id', 'email', 'password'];
    if (isAdmin) {
      selectFields.push('adminRole');
    }
  
    const user = await repo.findOne({
      where: { email: dto.email },
      select: selectFields,
    });
  
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async loginEtudiant(dto: LoginDto) {
    const user = await this.validateUser(this.etudiantRepo, dto);
    return this.generateToken({
      userId: user.id,
      email: user.email,
      role: 'etudiant',
      userType: 'etudiant'
    });
  }

  async loginEnseignant(dto: LoginDto) {
    const user = await this.validateUser(this.enseignantRepo, dto);
    return this.generateToken({
      userId: user.id,
      email: user.email,
      role: 'enseignant', // Now as simple string
      userType: 'enseignant'
    });
  }

  async loginAdministrateur(dto: LoginDto, requestedRole?: string) {
    const admin = await this.validateUser(this.adminRepo, dto, true);
    
    if (!admin.adminRole) {
      throw new UnauthorizedException('Admin role not assigned');
    }
  
    // Verify the admin has the requested role if specified
    if (requestedRole && admin.adminRole !== requestedRole) {
      throw new UnauthorizedException(`You are not authorized as ${requestedRole}`);
    }
  
    const tokenPayload = {
      userId: admin.id,
      email: admin.email,
      role: admin.adminRole,
      userType: 'administrateur'
    };
    
    return {
      access_token: this.jwtService.sign(tokenPayload),
      adminRole: admin.adminRole,
      email: admin.email,
      userId: admin.id
    };
  }
  private generateToken(payload: {
    userId: string;
    email: string;
    role: string | AdminRole; // Role can be string or AdminRole
    userType: string;
  }) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}