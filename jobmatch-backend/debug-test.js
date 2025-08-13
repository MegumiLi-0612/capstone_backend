// debug-test.js - 调试测试脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function debugTest() {
  try {
    // 先注册一个雇主
    console.log('🔹 注册雇主...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      email: `debug_employer_${Date.now()}@test.com`,
      password: 'password123',
      userType: 'employer',
      firstName: 'Debug',
      lastName: 'Employer',
      employerDetails: {
        companyName: 'Debug Company ' + Date.now()
      }
    });
    const token = registerRes.data.data.token;
    console.log('✅ 雇主注册成功');

    // 测试1：最简单的职位
    console.log('\n📝 Test 1: 最简单的职位');
    try {
      const res1 = await axios.post(`${API_BASE}/jobs`, {
        title: 'Simple Job',
        description: 'Simple description',
        location: 'Remote',
        type: 'Full-time',
        workType: 'Remote',
        experienceLevel: 'Entry Level'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 成功创建简单职位');
    } catch (error) {
      console.log('❌ 失败:', error.response?.data);
    }

    // 测试2：添加薪资信息
    console.log('\n📝 Test 2: 添加薪资信息');
    try {
      const res2 = await axios.post(`${API_BASE}/jobs`, {
        title: 'Job with Salary',
        description: 'Job description',
        location: 'San Francisco',
        type: 'Full-time',
        workType: 'On-site',
        experienceLevel: 'Entry Level',
        salaryMin: 5000,  // 使用数字而不是字符串
        salaryMax: 8000
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 成功创建带薪资的职位');
    } catch (error) {
      console.log('❌ 失败:', error.response?.data);
    }

    // 测试3：Internship 类型
    console.log('\n📝 Test 3: Internship 类型');
    try {
      const res3 = await axios.post(`${API_BASE}/jobs`, {
        title: 'Internship Position',
        description: 'Internship description',
        location: 'Remote',
        type: 'Internship',  // 测试 Internship
        workType: 'Remote',
        experienceLevel: 'Entry Level'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 成功创建实习职位');
    } catch (error) {
      console.log('❌ 失败:', error.response?.data);
    }

    // 测试4：添加数组字段
    console.log('\n📝 Test 4: 添加技能要求');
    try {
      const res4 = await axios.post(`${API_BASE}/jobs`, {
        title: 'Job with Skills',
        description: 'Job description',
        location: 'Remote',
        type: 'Full-time',
        workType: 'Remote',
        experienceLevel: 'Entry Level',
        skills: ['JavaScript', 'React']  // 添加技能数组
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 成功创建带技能要求的职位');
    } catch (error) {
      console.log('❌ 失败:', error.response?.data);
    }

    // 测试5：完整的职位信息
    console.log('\n📝 Test 5: 完整职位信息');
    try {
      const res5 = await axios.post(`${API_BASE}/jobs`, {
        title: 'Full Job Info',
        description: 'Complete job description',
        location: 'San Francisco, CA',
        type: 'Internship',
        workType: 'Hybrid',
        salaryMin: 6000,
        salaryMax: 8000,
        experienceLevel: 'Entry Level',
        duration: '3 months',
        hoursPerWeek: 40,
        applicationDeadline: '2025-03-01',
        requirements: ['Requirement 1'],
        skills: ['JavaScript'],
        benefits: ['Health Insurance']
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 成功创建完整职位');
    } catch (error) {
      console.log('❌ 失败:', error.response?.data);
    }

  } catch (error) {
    console.log('❌ 总体错误:', error.message);
  }
}

debugTest();