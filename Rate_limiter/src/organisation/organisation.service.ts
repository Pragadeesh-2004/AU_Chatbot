import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organisation, OrganisationDocument } from './schema/organisation.schema';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

@Injectable()
export class OrganisationService {
  constructor(
    @InjectModel(Organisation.name)
    private readonly organisationModel: Model<OrganisationDocument>,
  ) {}

  // Create Organisation
  async create(dto: CreateOrganisationDto) {
    try {
      const organisation = new this.organisationModel(dto);
      return await organisation.save();
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        throw new ConflictException('Organisation with this name already exists');
      }
      throw error;
    }
  }

  // Get all organisations
  async findAll() {
    return await this.organisationModel.find().exec();
  }

  // Get one organisation by ID
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid organisation ID');
    }

    const organisation = await this.organisationModel.findById(id).exec();
    
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  // Get organisation by name
  async findByName(name: string) {
    const organisation = await this.organisationModel.findOne({ name }).exec();
    
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  // Update organisation
  async update(id: string, dto: UpdateOrganisationDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid organisation ID');
    }

    try {
      const updatedOrganisation = await this.organisationModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .exec();

      if (!updatedOrganisation) {
        throw new NotFoundException('Organisation not found');
      }

      return updatedOrganisation;
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        throw new ConflictException('Organisation with this name already exists');
      }
      throw error;
    }
  }

  // Delete organisation
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid organisation ID');
    }

    const deletedOrganisation = await this.organisationModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedOrganisation) {
      throw new NotFoundException('Organisation not found');
    }

    return { 
      message: 'Organisation deleted successfully',
      deletedOrganisation 
    };
  }

  
}
