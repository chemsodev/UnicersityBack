import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Administrateur } from '../administrateur/administrateur.entity';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

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
    private readonly configService: ConfigService, // Add this line
  ) {}

  private async validate(repo: Repository<any>, dto: LoginDto) {
    const user = await repo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password'],
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async loginEtudiant(dto: LoginDto) {
    const user = await this.validate(this.etudiantRepo, dto);
    return this.generateToken(user.id, user.email, 'etudiant');
  }

  async loginEnseignant(dto: LoginDto) {
    const user = await this.validate(this.enseignantRepo, dto);
    return this.generateToken(user.id, user.email, 'enseignant');
  }

  async loginAdministrateur(dto: LoginDto) {
    const admin = await this.validate(this.adminRepo, dto);
    const payload = { 
      sub: admin.id,
      email: admin.email,
      type: 'administrateur',
      ...(admin.adminRole && { adminRole: admin.adminRole })
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: payload
    };
  }

  private generateToken(sub: number, email: string, type: string) {
    const payload = { sub, email, type };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION_TIME') || '60m'
      }),
      user: payload
    };
  }

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET')
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}