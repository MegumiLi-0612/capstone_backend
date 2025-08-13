// test-without-skills.js - 不包含技能的测试
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testWithoutSkills() {
  try {
    // 注册雇主
    console.log('🔹 注册雇主...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      email: `employer_test_${Date.now()}@test.com`,
      password: 'password123',
      userType: 'employer',
      firstName: 'Test',
      lastName: 'Employer',
      employerDetails: {
        companyName: 'Test Company ' + Date.now()
      }
    });
    const employerToken = registerRes.data.data.token;
    console.log('✅ 雇主注册成功');

    // 注册学生
    console.log('\n🔹 注册学生...');
    const studentRes = await axios.post(`${API_BASE}/auth/register`, {
      email: `student_test_${Date.now()}@test.com`,
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
    const studentToken = studentRes.data.data.token;
    console.log('✅ 学生注册成功');

    // 创建职位（不包含技能）
    console.log('\n🔹 创建职位（不包含技能）...');
    const jobRes = await axios.post(
      `${API_BASE}/jobs`,
      {
        title: 'Software Engineer Position',
        description: 'Great opportunity for talented engineers',
        location: 'San Francisco, CA',
        type: 'Full-time',
        workType: 'Hybrid',
        salaryMin: 100000,
        salaryMax: 150000,
        experienceLevel: 'Mid Level',
        duration: 'Permanent',
        hoursPerWeek: 40,
        applicationDeadline: '2025-03-01',
        requirements: [
          'Bachelor degree in Computer Science',
          '3+ years of experience'
        ],
        benefits: [
          'Health Insurance',
          '401k',
          'Flexible Hours'
        ]
        // 注意：不包含 skills 字段
      },
      {
        headers: { Authorization: `Bearer ${employerToken}` }
      }
    );
    console.log('✅ 职位创建成功');
    console.log('Job ID:', jobRes.data.data.jobId);
    const jobId = jobRes.data.data.jobId;

    // 查看职位详情
    console.log('\n🔹 查看职位详情...');
    const jobDetailRes = await axios.get(`${API_BASE}/jobs/${jobId}`);
    console.log('✅ 职位详情:');
    console.log('- Title:', jobDetailRes.data.data.title);
    console.log('- Company:', jobDetailRes.data.data.company);
    console.log('- Salary:', `$${jobDetailRes.data.data.salaryMin} - $${jobDetailRes.data.data.salaryMax}`);

    // 学生申请职位
    console.log('\n🔹 学生申请职位...');
    const applicationRes = await axios.post(
      `${API_BASE}/applications`,
      {
        jobId: jobId,
        coverLetter: 'I am very interested in this position...',
        resumeUrl: 'https://example.com/resume.pdf'
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    console.log('✅ 申请提交成功');
    console.log('Application ID:', applicationRes.data.data.applicationId);

    // 创建任务
    console.log('\n🔹 创建任务...');
    const taskRes = await axios.post(
      `${API_BASE}/tasks`,
      {
        text: 'Prepare for interview',
        category: 'interview',
        priority: 'high'
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    console.log('✅ 任务创建成功');

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testWithoutSkills();