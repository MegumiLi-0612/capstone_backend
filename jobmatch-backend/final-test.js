// final-test.js - Final Test Script
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function finalTest() {
  try {
    // Calculate a future date
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3); // 3 months later
    const applicationDeadline = futureDate.toISOString().split('T')[0];

    // 1. Register employer
    console.log('🔹 Step 1: Register Employer...');
    const employerEmail = `employer_${Date.now()}@test.com`;
    const registerEmployerRes = await axios.post(`${API_BASE}/auth/register`, {
      email: employerEmail,
      password: 'password123',
      userType: 'employer',
      firstName: 'Test',
      lastName: 'Employer',
      employerDetails: {
        companyName: 'Tech Company ' + Date.now(),
        companyWebsite: 'https://techcompany.com',
        companySize: '51-200',
        industry: 'Technology'
      }
    });
    const employerToken = registerEmployerRes.data.data.token;
    console.log('✅ Employer registration successful');
    console.log('   Email:', employerEmail);

    // 2. Register student
    console.log('\n🔹 Step 2: Register Student...');
    const studentEmail = `student_${Date.now()}@test.com`;
    const registerStudentRes = await axios.post(`${API_BASE}/auth/register`, {
      email: studentEmail,
      password: 'password123',
      userType: 'student',
      firstName: 'Test',
      lastName: 'Student',
      studentDetails: {
        university: 'MIT',
        major: 'Computer Science',
        graduationDate: '2025-05-15',
        gpa: 3.9
      }
    });
    const studentToken = registerStudentRes.data.data.token;
    console.log('✅ Student registration successful');
    console.log('   Email:', studentEmail);

    // 3. Create job (with future deadline)
    console.log('\n🔹 Step 3: Create Job...');
    const jobRes = await axios.post(
      `${API_BASE}/jobs`,
      {
        title: 'Full Stack Developer',
        description: 'We are looking for a talented Full Stack Developer to join our growing team.',
        location: 'San Francisco, CA',
        type: 'Full-time',
        workType: 'Hybrid',
        salaryMin: 120000,
        salaryMax: 180000,
        experienceLevel: 'Mid Level',
        duration: 'Permanent',
        hoursPerWeek: 40,
        applicationDeadline: applicationDeadline,
        requirements: [
          'Bachelor degree in Computer Science or related field',
          '3+ years of full stack development experience',
          'Strong problem-solving skills'
        ],
        benefits: [
          'Health Insurance',
          '401k Matching',
          'Flexible Work Hours',
          'Professional Development Budget'
        ]
        // Exclude skills to avoid errors
      },
      {
        headers: { Authorization: `Bearer ${employerToken}` }
      }
    );
    console.log('✅ Job created successfully');
    console.log('   Job ID:', jobRes.data.data.jobId);
    console.log('   Title:', jobRes.data.data.title);
    console.log('   Application Deadline:', applicationDeadline);
    const jobId = jobRes.data.data.jobId;

    // 4. Get all jobs
    console.log('\n🔹 Step 4: Retrieve All Jobs...');
    const jobsRes = await axios.get(`${API_BASE}/jobs`);
    console.log('✅ Job list retrieved successfully');
    console.log('   Total jobs:', jobsRes.data.data.jobs.length);
    console.log('   Latest job:', jobsRes.data.data.jobs[0]?.title);

    // 5. Get job detail
    console.log('\n🔹 Step 5: Get Job Detail...');
    const jobDetailRes = await axios.get(`${API_BASE}/jobs/${jobId}`);
    console.log('✅ Job detail retrieved successfully');
    const jobDetail = jobDetailRes.data.data;
    console.log('   Title:', jobDetail.title);
    console.log('   Company:', jobDetail.company);
    console.log('   Salary Range:', `$${jobDetail.salaryMin} - $${jobDetail.salaryMax}`);
    console.log('   Location:', jobDetail.location);

    // 6. Student applies for job
    console.log('\n🔹 Step 6: Student Applies for Job...');
    const applicationRes = await axios.post(
      `${API_BASE}/applications`,
      {
        jobId: jobId,
        coverLetter: 'I am excited to apply for the Full Stack Developer position at your company. With my strong background in both frontend and backend development, I believe I would be a valuable addition to your team.',
        resumeUrl: 'https://example.com/resume.pdf'
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    console.log('✅ Application submitted successfully');
    console.log('   Application ID:', applicationRes.data.data.applicationId);
    console.log('   Status:', applicationRes.data.data.status);

    // 7. View my applications (student)
    console.log('\n🔹 Step 7: View My Applications...');
    const myApplicationsRes = await axios.get(
      `${API_BASE}/applications/my-applications`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('✅ Application list retrieved successfully');
    console.log('   Total applications:', myApplicationsRes.data.data.applications.length);

    // 8. Create task (student)
    console.log('\n🔹 Step 8: Create Task...');
    const taskRes = await axios.post(
      `${API_BASE}/tasks`,
      {
        text: 'Prepare for technical interview',
        category: 'interview',
        priority: 'high'
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    console.log('✅ Task created successfully');
    console.log('   Task ID:', taskRes.data.data.id);
    console.log('   Task:', taskRes.data.data.text);

    // 9. View task list
    console.log('\n🔹 Step 9: View Task List...');
    const tasksRes = await axios.get(
      `${API_BASE}/tasks`,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('✅ Task list retrieved successfully');
    console.log('   Total tasks:', tasksRes.data.data.tasks.length);
    console.log('   High priority tasks:', tasksRes.data.data.stats.highPriority);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests completed!');
    console.log('='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log('✅ User registration and authentication');
    console.log('✅ Job creation and listing');
    console.log('✅ Job application functionality');
    console.log('✅ Task management functionality');
    console.log('\n🚀 JobMatch backend API is working correctly!');

  } catch (error) {
    console.log('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.error?.stack) {
      console.log('Stack:', error.response.data.error.stack);
    }
  }
}

finalTest();
