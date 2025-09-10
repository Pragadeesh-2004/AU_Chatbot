import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { Organisation, OrganisationSchema } from './schema/organisation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organisation.name, schema: OrganisationSchema }
    ])
  ],
  controllers: [OrganisationController],
  providers: [OrganisationService],
  exports: [OrganisationService, MongooseModule],
})
export class OrganisationModule {}
