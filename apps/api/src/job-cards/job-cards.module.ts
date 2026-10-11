import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobCard } from './entities/job-card.entity';
import { JobCardPart } from './entities/job-card-part.entity';
import { JobCardLabor } from './entities/job-card-labor.entity';
import { InventoryPart } from './entities/inventory-part.entity';
import { LaborCatalog } from './entities/labor-catalog.entity';
import { JobCardLog } from './entities/job-card-log.entity';
import { VehicleInspection } from './entities/vehicle-inspection.entity';
import { JobCardHandover } from './entities/job-card-handover.entity';
import { JobCardsService } from './job-cards.service';
import { JobCardsController } from './job-cards.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobCard,
      JobCardPart,
      JobCardLabor,
      InventoryPart,
      LaborCatalog,
      JobCardLog,
      VehicleInspection,
      JobCardHandover,
    ]),
  ],
  providers: [JobCardsService],
  controllers: [JobCardsController],
  exports: [JobCardsService],
})
export class JobCardsModule {}
