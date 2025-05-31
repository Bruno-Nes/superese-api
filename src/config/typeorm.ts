import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';
import { getDatabaseConfig } from './database.config';

const dataSourceOptions = getDatabaseConfig();

export const AppDataSource = new DataSource(
  dataSourceOptions as DataSourceOptions,
);

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
})
export class DatabaseModule {}
