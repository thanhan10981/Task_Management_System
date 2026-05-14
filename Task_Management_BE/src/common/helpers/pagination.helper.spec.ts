import {
  createPaginatedResponse,
  createPaginationOptions,
} from './pagination.helper';

describe('pagination.helper', () => {
  it('uses default pagination when dto is empty', () => {
    expect(createPaginationOptions({} as any)).toEqual({ skip: 0, take: 10 });
  });

  it('calculates skip and take from page and limit', () => {
    expect(createPaginationOptions({ page: 3, limit: 25 } as any)).toEqual({
      skip: 50,
      take: 25,
    });
  });

  it('wraps data with pagination metadata', () => {
    expect(createPaginatedResponse(['a', 'b'], 51, { page: 3, limit: 25 } as any)).toEqual({
      data: ['a', 'b'],
      meta: {
        total: 51,
        page: 3,
        limit: 25,
        totalPages: 3,
      },
    });
  });
});
