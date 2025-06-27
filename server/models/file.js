import { DataTypes } from 'sequelize'
import { sequelize } from '../datasource.js'
import { User } from './user.js'

export const File = sequelize.define('File', {
  file: {
    type: DataTypes.JSON,
    allowNull: false,
  },
})

// Many-to-many: Users <-> Files (shared files)
export const UserFiles = sequelize.define('UserFiles', {}, { timestamps: false })

User.belongsToMany(File, { through: UserFiles })
File.belongsToMany(User, { through: UserFiles })

File.belongsTo(User)
User.hasMany(File)
