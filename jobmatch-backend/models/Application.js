const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'interview', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  cover_letter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resume_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  applied_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'applications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['job_id', 'student_id']
    },
    {
      fields: ['student_id', 'applied_at']
    },
    {
      fields: ['job_id', 'status']
    }
  ]
});

// Instance methods
Application.prototype.updateStatus = async function(newStatus) {
  this.status = newStatus;
  await this.save();
};

Application.prototype.isActive = function() {
  return ['pending', 'reviewed', 'interview'].includes(this.status);
};

// Class methods
Application.getByStudent = async function(studentId) {
  return await this.findAll({
    where: { student_id: studentId },
    order: [['applied_at', 'DESC']]
  });
};

Application.getByJob = async function(jobId) {
  return await this.findAll({
    where: { job_id: jobId },
    order: [['applied_at', 'DESC']]
  });
};

module.exports = Application;