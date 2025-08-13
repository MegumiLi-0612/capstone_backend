const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Job, Employer, Skill, JobRequirement, JobBenefit, Application, Student } = require('../models');
const { AppError } = require('../middleware/errorHandler');

// Get all jobs with filters
const getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      location,
      experienceLevel,
      search,
      sortBy = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { is_active: true };

    // Apply filters
    if (type) where.job_type = type;
    if (location) where.location = { [Op.like]: `%${location}%` };
    if (experienceLevel) where.experience_level = experienceLevel;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Only show jobs with future deadlines
    where.application_deadline = {
      [Op.or]: [
        { [Op.gte]: new Date() },
        { [Op.is]: null }
      ]
    };

    const jobs = await Job.findAndCountAll({
      where,
      include: [
        {
          model: Employer,
          as: 'employer',
          attributes: ['id', 'company_name', 'company_website', 'logo_url']
        },
        {
          model: Skill,
          as: 'requiredSkills',
          through: { attributes: [] }
        },
        {
          model: JobRequirement,
          as: 'requirements',
          attributes: ['requirement']
        },
        {
          model: JobBenefit,
          as: 'benefits',
          attributes: ['benefit']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, order]],
      distinct: true
    });

    // Check if user has applied (if authenticated)
    if (req.userId && req.userType === 'student') {
      const applicationJobIds = await Application.findAll({
        where: { student_id: req.studentId },
        attributes: ['job_id']
      });
      const appliedJobIds = applicationJobIds.map(app => app.job_id);

      jobs.rows = jobs.rows.map(job => {
        const jobData = job.toJSON();
        jobData.hasApplied = appliedJobIds.includes(job.id);
        return jobData;
      });
    }

    res.json({
      success: true,
      data: {
        jobs: jobs.rows.map(job => ({
          id: job.id,
          title: job.title,
          company: job.employer.company_name,
          location: job.location,
          type: job.job_type,
          workType: job.work_type,
          salaryMin: job.salary_min,
          salaryMax: job.salary_max,
          hourlyRate: job.hourly_rate,
          experienceLevel: job.experience_level,
          duration: job.duration,
          hoursPerWeek: job.hours_per_week,
          startDate: job.start_date,
          applicationDeadline: job.application_deadline,
          description: job.description,
          requirements: job.requirements?.map(r => r.requirement) || [],
          skills: job.requiredSkills?.map(s => s.name) || [],
          benefits: job.benefits?.map(b => b.benefit) || [],
          postedDate: job.created_at,
          applicationCount: job.applicationCount || 0,
          hasApplied: job.hasApplied || false
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(jobs.count / limit),
          totalItems: jobs.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single job by ID
const getJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId, {
      include: [
        {
          model: Employer,
          as: 'employer',
          include: [{
            model: require('../models/User'),
            as: 'user',
            attributes: ['email', 'first_name', 'last_name']
          }]
        },
        {
          model: Skill,
          as: 'requiredSkills',
          through: { attributes: [] }
        },
        {
          model: JobRequirement,
          as: 'requirements'
        },
        {
          model: JobBenefit,
          as: 'benefits'
        }
      ]
    });

    if (!job) {
      return next(new AppError('NOT_FOUND', 'Job not found', 404));
    }

    // Get application count
    const applicationCount = await Application.count({
      where: { job_id: jobId }
    });

    // Check if current user has applied or saved
    let hasApplied = false;
    let hasSaved = false;

    if (req.userId && req.userType === 'student') {
      const application = await Application.findOne({
        where: { job_id: jobId, student_id: req.studentId }
      });
      hasApplied = !!application;

      const student = await Student.findByPk(req.studentId, {
        include: [{
          model: Job,
          as: 'savedJobs',
          where: { id: jobId },
          required: false
        }]
      });
      hasSaved = student.savedJobs && student.savedJobs.length > 0;
    }

    res.json({
      success: true,
      data: {
        id: job.id,
        title: job.title,
        company: job.employer.company_name,
        employer: {
          id: job.employer.id,
          companyName: job.employer.company_name,
          companyWebsite: job.employer.company_website,
          companySize: job.employer.company_size,
          industry: job.employer.industry,
          logoUrl: job.employer.logo_url,
          companyDescription: job.employer.company_description,
          isVerified: job.employer.is_verified
        },
        location: job.location,
        type: job.job_type,
        workType: job.work_type,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        hourlyRate: job.hourly_rate,
        experienceLevel: job.experience_level,
        duration: job.duration,
        hoursPerWeek: job.hours_per_week,
        startDate: job.start_date,
        applicationDeadline: job.application_deadline,
        description: job.description,
        requirements: job.requirements?.map(r => r.requirement) || [],
        skills: job.requiredSkills?.map(s => s.name) || [],
        benefits: job.benefits?.map(b => b.benefit) || [],
        postedDate: job.created_at,
        isActive: job.is_active,
        applicationCount,
        hasApplied,
        hasSaved
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new job (Employer only)
const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('VALIDATION_ERROR', 'Invalid input data', 400, errors.array()));
    }

    const {
      title,
      description,
      location,
      type,
      workType,
      salaryMin,
      salaryMax,
      hourlyRate,
      experienceLevel,
      duration,
      hoursPerWeek,
      startDate,
      applicationDeadline,
      requirements,
      skills,
      benefits
    } = req.body;

    // Create job
    const job = await Job.create({
      employer_id: req.employerId,
      title,
      description,
      location,
      job_type: type,
      work_type: workType,
      salary_min: salaryMin,
      salary_max: salaryMax,
      hourly_rate: hourlyRate,
      experience_level: experienceLevel,
      duration,
      hours_per_week: hoursPerWeek,
      start_date: startDate,
      application_deadline: applicationDeadline
    });

    // Add requirements
    if (requirements && requirements.length > 0) {
      const requirementData = requirements.map(req => ({
        job_id: job.id,
        requirement: req
      }));
      await JobRequirement.bulkCreate(requirementData);
    }

    // Add benefits
    if (benefits && benefits.length > 0) {
      const benefitData = benefits.map(benefit => ({
        job_id: job.id,
        benefit: benefit
      }));
      await JobBenefit.bulkCreate(benefitData);
    }

    // Add skills - 修复版本
    if (skills && skills.length > 0) {
      const skillInstances = await Promise.all(
        skills.map(async (skillName) => {
          const [skill, created] = await Skill.findOrCreate({
            where: { name: skillName },
            defaults: { name: skillName }
          });
          return skill;
        })
      );
      await job.setRequiredSkills(skillInstances);
    }

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: {
        jobId: job.id,
        title: job.title,
        postedDate: job.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update job (Employer only)
const updateJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Check if job exists and belongs to employer
    const job = await Job.findOne({
      where: { id: jobId, employer_id: req.employerId }
    });

    if (!job) {
      return next(new AppError('NOT_FOUND', 'Job not found or unauthorized', 404));
    }

    // Update job fields
    const updateFields = ['title', 'description', 'location', 'salary_min', 'salary_max', 
                         'hourly_rate', 'duration', 'hours_per_week', 'start_date', 
                         'application_deadline'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    if (req.body.type) job.job_type = req.body.type;
    if (req.body.workType) job.work_type = req.body.workType;
    if (req.body.experienceLevel) job.experience_level = req.body.experienceLevel;

    await job.save();

    // Update requirements if provided
    if (req.body.requirements) {
      await JobRequirement.destroy({ where: { job_id: jobId } });
      const requirementData = req.body.requirements.map(req => ({
        job_id: jobId,
        requirement: req
      }));
      await JobRequirement.bulkCreate(requirementData);
    }

    // Update benefits if provided
    if (req.body.benefits) {
      await JobBenefit.destroy({ where: { job_id: jobId } });
      const benefitData = req.body.benefits.map(benefit => ({
        job_id: jobId,
        benefit: benefit
      }));
      await JobBenefit.bulkCreate(benefitData);
    }

    // Update skills if provided - 修复版本
    if (req.body.skills) {
      const skillInstances = await Promise.all(
        req.body.skills.map(async (skillName) => {
          const [skill, created] = await Skill.findOrCreate({
            where: { name: skillName },
            defaults: { name: skillName }
          });
          return skill;
        })
      );
      await job.setRequiredSkills(skillInstances);
    }

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { jobId: job.id }
    });
  } catch (error) {
    next(error);
  }
};

// Delete/Deactivate job (Employer only)
const deleteJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({
      where: { id: jobId, employer_id: req.employerId }
    });

    if (!job) {
      return next(new AppError('NOT_FOUND', 'Job not found or unauthorized', 404));
    }

    // Soft delete - just deactivate
    job.is_active = false;
    await job.save();

    res.json({
      success: true,
      message: 'Job deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get jobs by employer
const getEmployerJobs = async (req, res, next) => {
  try {
    const jobs = await Job.findAll({
      where: { employer_id: req.employerId },
      include: [
        {
          model: Application,
          as: 'applications',
          attributes: ['id', 'status']
        },
        {
          model: Skill,
          as: 'requiredSkills',
          through: { attributes: [] }
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const jobsWithStats = jobs.map(job => {
      const applications = job.applications || [];
      return {
        id: job.id,
        title: job.title,
        location: job.location,
        type: job.job_type,
        isActive: job.is_active,
        postedDate: job.created_at,
        applicationDeadline: job.application_deadline,
        totalApplications: applications.length,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        skills: job.requiredSkills?.map(s => s.name) || []
      };
    });

    res.json({
      success: true,
      data: jobsWithStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs
};