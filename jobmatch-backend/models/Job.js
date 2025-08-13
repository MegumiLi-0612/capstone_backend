const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employers',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  job_type: {
    type: DataTypes.ENUM('Full-time', 'Part-time', 'Internship', 'Contract'),
    allowNull: false
  },
  work_type: {
    type: DataTypes.ENUM('On-site', 'Remote', 'Hybrid'),
    allowNull: false
  },
  salary_min: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  salary_max: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  hourly_rate: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  experience_level: {
    type: DataTypes.ENUM('Entry Level', 'Mid Level', 'Senior Level'),
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  hours_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 80
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  application_deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'jobs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['is_active', 'application_deadline']
    },
    {
      fields: ['location']
    },
    {
      fields: ['job_type']
    }
  ]
});

// Instance methods
Job.prototype.isExpired = function() {
  if (!this.application_deadline) return false;
  return new Date(this.application_deadline) < new Date();
};

Job.prototype.getDaysUntilDeadline = function() {
  if (!this.application_deadline) return null;
  const today = new Date();
  const deadline = new Date(this.application_deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

Job.prototype.getSalaryRange = function() {
  if (this.salary_min && this.salary_max) {
    return `$${this.salary_min} - $${this.salary_max}`;
  }
  if (this.hourly_rate) {
    return `$${this.hourly_rate}/hour`;
  }
  return 'Negotiable';
};

// Class methods
Job.getActiveJobs = async function() {
  return await this.findAll({
    where: { is_active: true },
    order: [['created_at', 'DESC']]
  });
};

module.exports = Job;