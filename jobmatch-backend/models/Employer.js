const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employer = sequelize.define('Employer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company_website: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  company_size: {
    type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  company_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'employers',
  timestamps: true,
  underscored: true
});

module.exports = Employer;