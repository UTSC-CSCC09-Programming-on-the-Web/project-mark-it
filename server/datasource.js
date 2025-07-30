import 'dotenv/config'
import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize({
  database: process.env.POSTGRES_DB || 'markit_db',
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  dialect: 'postgres',
});
