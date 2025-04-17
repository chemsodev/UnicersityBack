import { Module } from '@nestjs/common';
import { EnseignantService } from './enseignant.service';
import { EnseignantController } from './enseignant.controller';

@Module({
  providers: [EnseignantService],
  controllers: [EnseignantController]
})
export class EnseignantModule {}
