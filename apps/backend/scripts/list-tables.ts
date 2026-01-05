import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

async function listTables() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✓ Connected to Supabase database\n');

    const result = await client.query(`
      SELECT
        schemaname as schema,
        tablename as table_name,
        tableowner as owner
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename;
    `);

    if (result.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log(`Found ${result.rows.length} table(s):\n`);
      console.table(result.rows);
    }

    await client.end();
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

listTables();
