const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  text: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('resume', 'application', 'interview', 'research', 'networking', 'portfolio', 'follow-up', 'custom'),
    defaultValue: 'custom'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['student_id', 'completed', 'priority']
    }
  ],
  hooks: {
    beforeUpdate: (task) => {
      if (task.changed('completed') && task.completed === true) {
        task.completed_at = new Date();
      } else if (task.changed('completed') && task.completed === false) {
        task.completed_at = null;
      }
    }
  }
});

// Instance methods
Task.prototype.toggleComplete = async function() {
  this.completed = !this.completed;
  await this.save();
};

// Class methods
Task.getByStudent = async function(studentId, options = {}) {
  const where = { student_id: studentId };
  
  if (options.completed !== undefined) {
    where.completed = options.completed;
  }
  
  if (options.priority) {
    where.priority = options.priority;
  }
  
  if (options.category) {
    where.category = options.category;
  }
  
  return await this.findAll({
    where,
    order: [
      ['completed', 'ASC'],
      ['priority', 'DESC'],
      ['created_at', 'DESC']
    ]
  });
};

Task.getStats = async function(studentId) {
  const tasks = await this.findAll({
    where: { student_id: studentId }
  });
  
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => !t.completed && t.priority === 'high').length
  };
  
  return stats;
};

module.exports = Task;