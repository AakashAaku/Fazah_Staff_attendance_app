import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config(); // Load .env for CLI

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'garage',
  password: process.env.DB_PASSWORD || 'i@m@PG',
  database: process.env.DB_DATABASE || 'garageclock',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: true, // Use synchronize for easier dev without migrations
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
