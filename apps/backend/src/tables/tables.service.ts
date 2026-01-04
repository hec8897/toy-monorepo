import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TablesService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getTableList() {
    const query = `
      SELECT
        schemaname as schema,
        tablename as table_name,
        tableowner as owner
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    const result = await this.dataSource.query(query);
    return {
      count: result.length,
      tables: result,
    };
  }
}
