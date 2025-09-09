// Abstract base repository interface
export interface BaseRepository<T, CreateData, UpdateData> {
  create(data: CreateData): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: UpdateData): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Query options for filtering and pagination
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Generic list response
export interface ListResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}