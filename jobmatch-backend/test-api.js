// test-api.js - 快速测试所有 API
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';
let studentToken = '';
let employerToken = '';
let createdJobId = '';

// 测试结果
const testResults = [];

// 辅助函数
async function runTest(name, testFn) {
  console.log(`\n📋 Testing: ${name}`);
  try {
    const result = await testFn();
    console.log(`✅ PASS: ${name}`);
    testResults.push({ name, status: 'PASS', result });
    return result;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
    testResults.push({ name, status: 'FAIL', error: error.message });
    throw error;
  }
}

// 测试函数
async function testAPI() {
  console.log('🚀 Starting API Tests...\n');

  // 1. 注册学生
  await runTest('Register Student', async () => {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email: `student_${Date.now()}@test.com`,
      password: 'password123',
      userType: 'student',
      firstName: 'Test',
      lastName: 'Student',
      studentDetails: {
        university: 'Test University',
        major: 'Computer Science',
        graduationDate: '2025-05-15',
        gpa: 3.8
      }
    });
    studentToken = response.data.data.token;
    return response.data;
  });

  // 2. 注册雇主
  await runTest('Register Employer', async () => {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email: `employer_${Date.now()}@test.com`,
      password: 'password123',
      userType: 'employer',
      firstName: 'Test',
      lastName: 'Employer',
      employerDetails: {
        companyName: 'Test Company',
        companyWebsite: 'https://test.com',
        companySize: '11-50',
        industry: 'Technology'
      }
    });
    employerToken = response.data.data.token;
    return response.data;
  });

  // 3. 获取当前用户信息
  await runTest('Get Current User (Student)', async () => {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    return response.data;
  });

  // 4. 创建职位（雇主）
  await runTest('Create Job', async () => {
    const response = await axios.post(
      `${API_BASE}/jobs`,
      {
        title: 'Software Engineer Intern',
        description: 'Great opportunity for students',
        location: 'San Francisco, CA',
        type: 'Internship',
        workType: 'Hybrid',
        salaryMin: 6000,
        salaryMax: 8000,
        experienceLevel: 'Entry Level',
        duration: '3 months',
        hoursPerWeek: 40,
        applicationDeadline: '2025-03-01',
        requirements: ['Strong programming skills', 'Team player'],
        skills: ['JavaScript', 'React', 'Node.js'],
        benefits: ['Health Insurance', 'Free Lunch']
      },
      {
        headers: { Authorization: `Bearer ${employerToken}` }
      }
    );
    createdJobId = response.data.data.jobId;
    return response.data;
  });

  // 5. 获取所有职位
  await runTest('Get All Jobs', async () => {
    const response = await axios.get(`${API_BASE}/jobs`);
    return response.data;
  });

  // 6. 获取单个职位详情
  await runTest('Get Job Details', async () => {
    const response = await axios.get(`${API_BASE}/jobs/${createdJobId}`);
    return response.data;
  });

  // 7. 提交申请（学生）
  await runTest('Submit Application', async () => {
    const response = await axios.post(
      `${API_BASE}/applications`,
      {
        jobId: createdJobId,
        coverLetter: 'I am very interested in this position.',
        resumeUrl: 'https://example.com/resume.pdf'
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    return response.data;
  });

  // 8. 获取我的申请（学生）
  await runTest('Get My Applications', async () => {
    const response = await axios.get(`${API_BASE}/applications/my-applications`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    return response.data;
  });

  // 9. 创建任务（学生）
  await runTest('Create Task', async () => {
    const response = await axios.post(
      `${API_BASE}/tasks`,
      {
        text: 'Complete portfolio website',
        category: 'portfolio',
        priority: 'high'
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    return response.data;
  });

  // 10. 获取任务列表（学生）
  await runTest('Get Tasks', async () => {
    const response = await axios.get(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    return response.data;
  });

  // 打印测试总结
  console.log('\n📊 Test Summary:');
  console.log('================');
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  console.log(`Total Tests: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(2)}%`);
}

// 运行测试
testAPI().catch(console.error);

// 安装依赖：npm install axios