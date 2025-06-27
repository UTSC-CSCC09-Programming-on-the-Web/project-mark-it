import { DataTypes } from 'sequelize'
import { sequelize } from '../datasource.js'

export const User = sequelize.define('User', {
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})
