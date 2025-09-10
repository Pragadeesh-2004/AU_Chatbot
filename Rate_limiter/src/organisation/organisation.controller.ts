import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

@Controller('organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  // CREATE - Post new organisation (auto returns 201)
  @Post()
  create(@Body() createDto: CreateOrganisationDto) {
    return this.organisationService.create(createDto);
  }

  // READ - Get all organisations (auto returns 200)
  @Get()
  findAll() {
    return this.organisationService.findAll();
  }

  // READ - Get specific organisation by ID (auto returns 200)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organisationService.findOne(id);
  }

  // UPDATE - Update organisation (auto returns 200)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganisationDto,
  ) {
    return this.organisationService.update(id, updateDto);
  }

  // DELETE - Remove organisation (auto returns 200)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organisationService.remove(id);
  }
}
