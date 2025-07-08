import { Sequelize } from 'sequelize'
import { POSTGRES_USER, POSTGRES_PASSWORD } from './secrets.js'

export const sequelize = new Sequelize({
  database: 'markit',
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
});
