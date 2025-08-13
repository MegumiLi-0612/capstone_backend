const { validationResult } = require('express-validator');
const { Application, Job, Student, Employer, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Submit job application (Student only)
const submitApplication = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('VALIDATION_ERROR', 'Invalid input data', 400, errors.array()));
    }

    const { jobId, coverLetter, resumeUrl } = req.body;

    // Check if job exists and is active
    const job = await Job.findOne({
      where: { id: jobId, is_active: true }
    });

    if (!job) {
      return next(new AppError('NOT_FOUND', 'Job not found or inactive', 404));
    }

    // Check if deadline has passed
    if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
      return next(new AppError('DEADLINE_PASSED', 'Application deadline has passed', 400));
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      where: { job_id: jobId, student_id: req.studentId }
    });

    if (existingApplication) {
      return next(new AppError('DUPLICATE_ENTRY', 'You have already applied to this job', 409));
    }

    // Create application
    const application = await Application.create({
      job_id: jobId,
      student_id: req.studentId,
      cover_letter: coverLetter,
      resume_url: resumeUrl || req.profile.resume_url, // Use profile resume if not provided
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.id,
        jobId: application.job_id,
        status: application.status,
        appliedAt: application.applied_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get student's applications
const getMyApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { student_id: req.studentId };
    if (status) {
      where.status = status;
    }

    const applications = await Application.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: 'job',
          include: [
            {
              model: Employer,
              as: 'employer',
              attributes: ['id', 'company_name', 'logo_url']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['applied_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        applications: applications.rows.map(app => ({
          id: app.id,
          job: {
            id: app.job.id,
            title: app.job.title,
            company: app.job.employer.company_name,
            location: app.job.location,
            type: app.job.job_type,
            logoUrl: app.job.employer.logo_url
          },
          status: app.status,
          coverLetter: app.cover_letter,
          resumeUrl: app.resume_url,
          appliedAt: app.applied_at,
          updatedAt: app.updated_at
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(applications.count / limit),
          totalItems: applications.count
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get job applications (Employer only)
const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;

    // Verify job belongs to employer
    const job = await Job.findOne({
      where: { id: jobId, employer_id: req.employerId }
    });

    if (!job) {
      return next(new AppError('NOT_FOUND', 'Job not found or unauthorized', 404));
    }

    const where = { job_id: jobId };
    if (status) {
      where.status = status;
    }

    const applications = await Application.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['email', 'first_name', 'last_name', 'phone']
            }
          ]
        }
      ],
      order: [['applied_at', 'DESC']]
    });

    res.json({
      success: true,
      data: applications.map(app => ({
        id: app.id,
        status: app.status,
        coverLetter: app.cover_letter,
        resumeUrl: app.resume_url,
        appliedAt: app.applied_at,
        student: {
          id: app.student.id,
          name: `${app.student.user.first_name} ${app.student.user.last_name}`,
          email: app.student.user.email,
          phone: app.student.user.phone,
          university: app.student.university,
          major: app.student.major,
          graduationDate: app.student.graduation_date,
          gpa: app.student.gpa,
          linkedinUrl: app.student.linkedin_url,
          githubUrl: app.student.github_url
        }
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Update application status (Employer only)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'interview', 'accepted', 'rejected'].includes(status)) {
      return next(new AppError('VALIDATION_ERROR', 'Invalid status value', 400));
    }

    // Find application and verify employer owns the job
    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: Job,
          as: 'job',
          where: { employer_id: req.employerId }
        }
      ]
    });

    if (!application) {
      return next(new AppError('NOT_FOUND', 'Application not found or unauthorized', 404));
    }

    // Update status
    application.status = status;
    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        applicationId: application.id,
        newStatus: status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Withdraw application (Student only)
const withdrawApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findOne({
      where: { id: applicationId, student_id: req.studentId }
    });

    if (!application) {
      return next(new AppError('NOT_FOUND', 'Application not found', 404));
    }

    if (['accepted', 'rejected'].includes(application.status)) {
      return next(new AppError('INVALID_STATUS', 'Cannot withdraw finalized application', 400));
    }

    await application.destroy();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get application statistics (Student)
const getApplicationStats = async (req, res, next) => {
  try {
    const total = await Application.count({
      where: { student_id: req.studentId }
    });

    const byStatus = await Application.findAll({
      where: { student_id: req.studentId },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', 'status'), 'count']
      ],
      group: ['status']
    });

    const stats = {
      total,
      pending: 0,
      reviewed: 0,
      interview: 0,
      accepted: 0,
      rejected: 0
    };

    byStatus.forEach(item => {
      stats[item.status] = parseInt(item.dataValues.count);
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationStats
};