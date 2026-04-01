import { PaginationDto } from '../dto/pagination.dto';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function createPaginationOptions(dto: PaginationDto) {
  const page = dto.page || 1;
  const limit = dto.limit || 10;
  const skip = (page - 1) * limit;

  return { skip, take: limit };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  dto: PaginationDto,
) {
  const page = dto.page || 1;
  const limit = dto.limit || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    } as PaginationMeta,
  };
}
