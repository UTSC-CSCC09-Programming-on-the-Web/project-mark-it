import 'dotenv/config'
import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize({
  database: 'markit',
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
});
