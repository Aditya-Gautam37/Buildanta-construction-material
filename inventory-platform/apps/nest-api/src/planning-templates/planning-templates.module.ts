import { Module } from '@nestjs/common';
import { PlanningTemplatesService } from './planning-templates.service';

@Module({
  providers: [PlanningTemplatesService],
  exports: [PlanningTemplatesService],
})
export class PlanningTemplatesModule {}
