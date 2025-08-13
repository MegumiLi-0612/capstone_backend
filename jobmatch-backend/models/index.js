const { sequelize } = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Employer = require('./Employer');
const Job = require('./Job');
const Skill = require('./Skill');
const Application = require('./Application');
const Task = require('./Task');

// Define associations
// User associations
User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile' });
User.hasOne(Employer, { foreignKey: 'user_id', as: 'employerProfile' });

Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Employer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Job associations
Employer.hasMany(Job, { foreignKey: 'employer_id', as: 'jobs' });
Job.belongsTo(Employer, { foreignKey: 'employer_id', as: 'employer' });

// Application associations
Student.hasMany(Application, { foreignKey: 'student_id', as: 'applications' });
Job.hasMany(Application, { foreignKey: 'job_id', as: 'applications' });
Application.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Application.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

// Task associations
Student.hasMany(Task, { foreignKey: 'student_id', as: 'tasks' });
Task.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// Skill associations (Many-to-Many)
// Job Skills
Job.belongsToMany(Skill, { 
  through: 'job_skills', 
  foreignKey: 'job_id',
  otherKey: 'skill_id',
  as: 'requiredSkills' 
});
Skill.belongsToMany(Job, { 
  through: 'job_skills', 
  foreignKey: 'skill_id',
  otherKey: 'job_id',
  as: 'jobs' 
});

// Student Skills
Student.belongsToMany(Skill, { 
  through: 'student_skills', 
  foreignKey: 'student_id',
  otherKey: 'skill_id',
  as: 'skills' 
});
Skill.belongsToMany(Student, { 
  through: 'student_skills', 
  foreignKey: 'skill_id',
  otherKey: 'student_id',
  as: 'students' 
});

// Saved Jobs (Many-to-Many)
Student.belongsToMany(Job, { 
  through: 'saved_jobs', 
  foreignKey: 'student_id',
  otherKey: 'job_id',
  as: 'savedJobs',
  timestamps: false 
});
Job.belongsToMany(Student, { 
  through: 'saved_jobs', 
  foreignKey: 'job_id',
  otherKey: 'student_id',
  as: 'savedByStudents',
  timestamps: false 
});

// Job Requirements and Benefits
const JobRequirement = sequelize.define('JobRequirement', {
  id: {
    type: require('sequelize').DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  job_id: {
    type: require('sequelize').DataTypes.INTEGER,
    allowNull: false
  },
  requirement: {
    type: require('sequelize').DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'job_requirements',
  timestamps: true,
  underscored: true
});

const JobBenefit = sequelize.define('JobBenefit', {
  id: {
    type: require('sequelize').DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  job_id: {
    type: require('sequelize').DataTypes.INTEGER,
    allowNull: false
  },
  benefit: {
    type: require('sequelize').DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'job_benefits',
  timestamps: true,
  underscored: true
});

Job.hasMany(JobRequirement, { foreignKey: 'job_id', as: 'requirements' });
Job.hasMany(JobBenefit, { foreignKey: 'job_id', as: 'benefits' });
JobRequirement.belongsTo(Job, { foreignKey: 'job_id' });
JobBenefit.belongsTo(Job, { foreignKey: 'job_id' });

module.exports = {
  sequelize,
  User,
  Student,
  Employer,
  Job,
  Skill,
  Application,
  Task,
  JobRequirement,
  JobBenefit
};