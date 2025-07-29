import { DataTypes } from 'sequelize'
import { sequelize } from '../datasource.js'

export const TempFile = sequelize.define('TempFile', {
  file: {
    type: DataTypes.JSON,
    allowNull: false,
  },
})