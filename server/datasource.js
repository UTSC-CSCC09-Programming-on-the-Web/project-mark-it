import 'dotenv/config'
import { Sequelize } from 'sequelize'

console.log('Connecting to PostgreSQL database...');
console.log(`Database: ${process.env.POSTGRES_USER}`);

export const sequelize = new Sequelize({
  database: 'markit_db',
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: 'postgres',
  port: 5432,
  dialect: 'postgres',
  logging: console.log,
});
