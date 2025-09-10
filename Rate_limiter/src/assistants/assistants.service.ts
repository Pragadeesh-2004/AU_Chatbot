import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assistant, AssistantDocument } from './schema/assistants.schema';
import { CreateAssistantDto } from './dto/create-assistants.dto';
import { UpdateAssistantDto } from './dto/update-assistants.dto';

@Injectable()
export class AssistantsService {
  constructor(
    @InjectModel(Assistant.name)
    private readonly assistantModel: Model<AssistantDocument>,
  ) {}

  // CREATE - Create assistant for a specific organisation
  async createForOrganisation(orgId: string, dto: CreateAssistantDto) {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new NotFoundException('Invalid organisation ID');
    }

    try {
      const assistant = new this.assistantModel({
        ...dto,
        org_id: new Types.ObjectId(orgId),
      });
      return await assistant.save();
    } catch (error) {
      throw error;
    }
  }

  // READ - Get all assistants for a specific organisation
  async findByOrganisationWithRateLimit(orgId: string) {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new NotFoundException('Invalid organisation ID');
    }

    return await this.assistantModel
      .find({ org_id: new Types.ObjectId(orgId) })
      .exec();
  }

  // READ - Get specific assistant by organisation and assistant ID
  async findOneByOrganisation(orgId: string, assistantId: string) {
    if (!Types.ObjectId.isValid(orgId) || !Types.ObjectId.isValid(assistantId)) {
      throw new NotFoundException('Invalid ID provided');
    }

    const assistant = await this.assistantModel
      .findOne({ 
        _id: new Types.ObjectId(assistantId),
        org_id: new Types.ObjectId(orgId)
      })
      .exec();

    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    return assistant;
  }

  // READ - Get all assistants (without organisation filter)
  async findAll() {
    return await this.assistantModel.find().exec();
  }

  // READ - Get assistant by ID only
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid assistant ID');
    }

    const assistant = await this.assistantModel.findById(id).exec();
    
    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }

    return assistant;
  }

  // UPDATE - Update assistant
  async update(id: string, dto: UpdateAssistantDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid assistant ID');
    }

    try {
      const updatedAssistant = await this.assistantModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .exec();

      if (!updatedAssistant) {
        throw new NotFoundException('Assistant not found');
      }

      return updatedAssistant;
    } catch (error) {
      throw error;
    }
  }

  // DELETE - Remove assistant
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid assistant ID');
    }

    const deletedAssistant = await this.assistantModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedAssistant) {
      throw new NotFoundException('Assistant not found');
    }

    return {
      message: 'Assistant deleted successfully',
      id: id
    };
  }
}
