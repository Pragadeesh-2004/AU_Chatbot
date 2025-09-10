import { Injectable } from '@nestjs/common';
import { Model, SortOrder } from 'mongoose';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginationMeta } from '../../rate_limit/interfaces/api-response.interface';

// Define the return type interface
interface PaginationResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

@Injectable()
export class PaginationService {
  createPaginationMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const total_pages = Math.ceil(total / limit);
    
    return {
      current_page: page,
      per_page: limit,
      total,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    };
  }

  calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
  async paginate<T>(
    model: Model<T>,
    paginationDto: PaginationDto,
    filter: any = {},
    populate?: string | string[]
  ): Promise<PaginationResult<any>> {
    const { page = 1, limit = 5, sort_by = 'createdAt', sort_order = 'desc' } = paginationDto;
    
    const skip = this.calculateSkip(page, limit);
    const sortOrder: SortOrder = sort_order === 'desc' ? -1 : 1;
    const sortObj: Record<string, SortOrder> = { [sort_by]: sortOrder };

    

    try {
     const total = await model.countDocuments(filter);
      console.log('Building main query...');
      let query = model.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();

      if (populate) {
        query = query.populate(populate);
      }

      const data = await query.exec();
      const pagination = this.createPaginationMeta(total, page, limit);
     

      return { data, pagination };
    } catch (error) {
      throw error;
    }
  }
}