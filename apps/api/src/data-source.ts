import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config(); // Load .env for CLI and local runs

const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.NEON_DATABASE_URL || 
  process.env.NETLIFY_NEON_DATABASE_URL ||
  process.env.POSTGRES_URL;

const hasDatabaseUrl = Boolean(databaseUrl);
const isSslEnabled = 
  process.env.DB_SSL === 'true' || 
  (hasDatabaseUrl && !databaseUrl?.includes('localhost'));

export const dataSourceOptions: DataSourceOptions = hasDatabaseUrl
  ? {
      type: 'postgres',
      url: databaseUrl,
      ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: true, // Auto-sync table schema for instant zero-migration deployment
      logging: process.env.NODE_ENV !== 'production',
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'garage',
      password: process.env.DB_PASSWORD || 'i@m@PG',
      database: process.env.DB_DATABASE || 'garageclock',
      ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
    };

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
