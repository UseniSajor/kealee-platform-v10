/**
 * PostgreSQL Full-Text Search Service — tsvector abstraction
 */

export interface SearchOptions {
  query: string;
  tables: string[];
  columns: string[];
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
  orderBy?: 'relevance' | 'created_at' | 'updated_at';
  language?: string;
}

export interface SearchResult<T = Record<string, unknown>> {
  items: (T & { _rank: number })[];
  total: number;
  query: string;
  took: number; // ms
}

export class SearchService {
  constructor(private readonly prisma: any) {}

  /**
   * Execute a full-text search query using PostgreSQL tsvector
   */
  async search<T = Record<string, unknown>>(options: SearchOptions): Promise<SearchResult<T>> {
    const start = Date.now();
    const { query, tables, columns, limit = 20, offset = 0, language = 'english' } = options;

    if (!query.trim()) {
      return { items: [], total: 0, query, took: 0 };
    }

    // Convert search query to tsquery format
    const tsquery = query
      .trim()
      .split(/\s+/)
      .map(term => `${term}:*`)
      .join(' & ');

    // Build search across multiple tables using UNION
    const searchQueries = tables.map((table, idx) => {
      const columnExpr = columns
        .map(col => `coalesce(${col}::text, '')`)
        .join(" || ' ' || ");

      return `
        SELECT id, ${columns.join(', ')}, '${table}' as _source,
          ts_rank(to_tsvector('${language}', ${columnExpr}), to_tsquery('${language}', $1)) as _rank
        FROM "${table}"
        WHERE to_tsvector('${language}', ${columnExpr}) @@ to_tsquery('${language}', $1)
      `;
    });

    const unionQuery = searchQueries.join(' UNION ALL ');
    const finalQuery = `
      WITH search_results AS (${unionQuery})
      SELECT * FROM search_results
      ORDER BY _rank DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      WITH search_results AS (${unionQuery})
      SELECT COUNT(*) as total FROM search_results
    `;

    const [items, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe(finalQuery, tsquery),
      this.prisma.$queryRawUnsafe(countQuery, tsquery),
    ]);

    const total = Number((countResult as any[])[0]?.total ?? 0);

    return {
      items: items as (T & { _rank: number })[],
      total,
      query,
      took: Date.now() - start,
    };
  }

  /**
   * Simple search within a single table
   */
  async searchTable<T = Record<string, unknown>>(
    table: string,
    columns: string[],
    query: string,
    limit = 20,
  ): Promise<(T & { _rank: number })[]> {
    const result = await this.search<T>({
      query,
      tables: [table],
      columns,
      limit,
    });
    return result.items;
  }
}
