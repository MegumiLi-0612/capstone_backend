// simple-test.js - 简化的测试脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function simpleTest() {
  try {
    console.log('🔹 Step 1: Register Employer');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      email: `employer_${Date.now()}@test.com`,
      password: 'password123',
      userType: 'employer',
      firstName: 'Test',
      lastName: 'Employer',
      employerDetails: {
        companyName: 'Test Company ' + Date.now(),
        companyWebsite: 'https://test.com',
        companySize: '11-50',
        industry: 'Technology'
      }
    });
    console.log('✅ Employer registered');
    const employerToken = registerRes.data.data.token;
    console.log('Token:', employerToken.substring(0, 50) + '...');

    console.log('\n🔹 Step 2: Get current user info');
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${employerToken}` }
    });
    console.log('✅ User info retrieved');
    console.log('User type:', meRes.data.data.userType);
    console.log('Company:', meRes.data.data.employerProfile?.companyName);

    console.log('\n🔹 Step 3: Create a simple job');
    try {
      const jobRes = await axios.post(
        `${API_BASE}/jobs`,
        {
          title: 'Test Job',
          description: 'This is a test job',
          location: 'Remote',
          type: 'Full-time',
          workType: 'Remote',
          experienceLevel: 'Entry Level'
        },
        {
          headers: { Authorization: `Bearer ${employerToken}` }
        }
      );
      console.log('✅ Job created successfully');
      console.log('Job ID:', jobRes.data.data.jobId);
    } catch (error) {
      console.log('❌ Job creation failed');
      console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n🔹 Step 4: Get all jobs (public)');
    const jobsRes = await axios.get(`${API_BASE}/jobs`);
    console.log('✅ Jobs retrieved');
    console.log('Total jobs:', jobsRes.data.data.jobs.length);

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

simpleTest();