// test-db.js - 在根目录创建这个文件来测试数据库连接
const { sequelize } = require('./config/database');
const models = require('./models');

async function testConnection() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // 同步所有模型（创建表）
    console.log('📦 Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully.');
    
    // 创建一些初始技能数据
    console.log('🌱 Creating initial skills...');
    const skills = [
      { name: 'Python', category: 'Programming' },
      { name: 'JavaScript', category: 'Programming' },
      { name: 'React.js', category: 'Frontend' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'MySQL', category: 'Database' },
      { name: 'Git', category: 'Tools' }
    ];
    
    for (const skill of skills) {
      try {
        await models.Skill.findOrCreate({
          where: { name: skill.name },
          defaults: { category: skill.category }
        });
      } catch (error) {
        console.log(`Skill ${skill.name} might already exist`);
      }
    }
    console.log('✅ Initial skills created.');
    
    // 显示所有创建的表
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('\n📋 Created tables:', tables);
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection();