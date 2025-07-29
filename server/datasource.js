import { Sequelize } from 'sequelize'
import { POSTGRES_USER, POSTGRES_PASSWORD } from './secrets.js'

export const sequelize = new Sequelize({
  database: 'markit_db',
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  host: 'postgres',
  port: 5432,
  dialect: 'postgres',
  logging: console.log,
});
