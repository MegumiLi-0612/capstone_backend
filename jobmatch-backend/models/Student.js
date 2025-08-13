const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
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
  university: {
    type: DataTypes.STRING,
    allowNull: true
  },
  major: {
    type: DataTypes.STRING,
    allowNull: true
  },
  graduation_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gpa: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0.0,
      max: 4.0
    }
  },
  resume_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  linkedin_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  github_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'students',
  timestamps: true,
  underscored: true
});

// Instance methods
Student.prototype.isGraduated = function() {
  if (!this.graduation_date) return false;
  return new Date(this.graduation_date) < new Date();
};

Student.prototype.getGraduationYear = function() {
  if (!this.graduation_date) return null;
  return new Date(this.graduation_date).getFullYear();
};

module.exports = Student;