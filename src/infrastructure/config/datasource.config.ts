import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import configuration from './configuration';

config();

export const getDataSourceOptions = (): DataSourceOptions => {
  return {
    type: 'postgres',
    host: configuration().database.host,
    port: configuration().database.port,
    username: configuration().database.username,
    password: configuration().database.password,
    database: configuration().database.database,
    entities: configuration().database.entities,
    migrations: configuration().database.migrations,
    subscribers: configuration().database.subscribers,
    synchronize: configuration().database.synchronize,
    migrationsRun: configuration().database.migrationsRun,
  };
};

export const dataSource = new DataSource(getDataSourceOptions());
