import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import {
  sendEmail,
  applicationConfirmationEmail,
  interviewScheduledEmail,
  statusChangeEmail,
  newApplicationEmail,
  referralInviteEmail,
  referralStatusEmail,
  offerLetterEmail,
  offerResponseEmail,
  nurtureEmail,
} from './email';


// ─── Prisma ───────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

// ─── Fastify ──────────────────────────────────────────────────────────────────
const server = Fastify({ logger: true });

server.register(cors, { origin: true });
server.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret' });
server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// ─── Auth Decorator ───────────────────────────────────────────────────────────
server.decorate('authenticate', async (request: any, reply: any) => {
  try {
    const decoded = await request.jwtVerify();
    // Fetch fresh user data to ensure up-to-date RBAC and Org context
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).id },
      include: { organization: true, department: true }
    });
    if (!user) throw new Error('User not found');
    request.user = user;
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// ─── Helper: create notification ──────────────────────────────────────────────
async function createNotification(userId: string, type: string, title: string, message: string, linkUrl?: string) {
  return prisma.notification.create({
    data: { userId, type, title, message, linkUrl },
  });
}

// ─── Health ───────────────────────────────────────────────────────────────────
server.get('/health', async () => ({ status: 'ok', service: 'hireflow-core-api', timestamp: new Date().toISOString() }));

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

server.post('/api/auth/register', async (request, reply) => {
  const { email, password, name, role } = request.body as any;
  if (!email || !password) {
    return reply.code(400).send({ error: 'Email and password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.code(409).send({ error: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      role: role === 'RECRUITER' ? 'RECRUITER' : 'JOB_SEEKER',
      passwordHash,
    },
  });

  const token = server.jwt.sign({ id: user.id, email: user.email, role: user.role });
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
});

server.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body as any;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const token = server.jwt.sign({ id: user.id, email: user.email, role: user.role });
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
});

server.get('/api/auth/me', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, organization: true, department: true },
  });
  return user;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

server.post('/api/profiles', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  const { skills, experienceYears, educationTier, location, resumeUrl } = request.body as any;

  const profile = await prisma.profile.upsert({
    where: { userId: id },
    create: {
      userId: id,
      skills: skills || [],
      experienceYears: experienceYears || 0,
      educationTier: educationTier || null,
      location: location || null,
      resumeUrl: resumeUrl || null,
    },
    update: {
      skills: skills || undefined,
      experienceYears: experienceYears ?? undefined,
      educationTier: educationTier ?? undefined,
      location: location ?? undefined,
      resumeUrl: resumeUrl ?? undefined,
    },
  });
  return profile;
});

server.get('/api/profiles/me', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  const profile = await prisma.profile.findUnique({ where: { userId: id } });
  return profile || { message: 'No profile found. Please create one.' };
});

server.post('/api/profiles/parse-resume', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { resumeText } = request.body as any;
  if (!resumeText) {
    return reply.code(400).send({ error: 'resumeText is required' });
  }

  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const res = await fetch(`${aiUrl}/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: resumeText }),
    });
    const parsed = await res.json();
    return parsed;
  } catch (err) {
    return reply.code(502).send({ error: 'AI service unavailable', details: String(err) });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// JOB ROUTES (RECRUITER FLOW)
// ═══════════════════════════════════════════════════════════════════════════════

server.post('/api/jobs', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id, role } = (request as any).user;
  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Only recruiters can post jobs' });
  }

  const { title, description, skillsRequired, location, salaryRange, seniority, industry, blindScreening } = request.body as any;
  if (!title || !description || !location) {
    return reply.code(400).send({ error: 'title, description, and location are required' });
  }

  const job = await prisma.job.create({
    data: {
      title,
      description,
      skillsRequired: skillsRequired || [],
      location,
      salaryRange: salaryRange || null,
      seniority: seniority || null,
      industry: industry || null,
      blindScreening: blindScreening || false,
      recruiterId: id,
    },
  });
  return job;
});

server.get('/api/jobs/mine', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id, role, organizationId, departmentId } = (request as any).user;
  let whereClause: any = { recruiterId: id };
  
  if (role === 'ORG_ADMIN') {
    whereClause = { organizationId };
  } else if (role === 'HIRING_MANAGER' && departmentId) {
    whereClause = { organizationId, departmentId };
  } else if (organizationId) {
    // If regular recruiter but part of org, maybe they see all org jobs or just theirs. 
    // Let's assume recruiters can see all jobs in their org for collaboration.
    whereClause = { organizationId };
  }

  const jobs = await prisma.job.findMany({
    where: whereClause,
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return jobs;
});

server.get('/api/jobs/:jobId/candidates', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { jobId } = request.params as any;
  const { id } = (request as any).user;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  
  // Role-based visibility logic
  const { role, organizationId, departmentId } = (request as any).user;
  let canView = false;
  if (job?.recruiterId === id) canView = true;
  else if (role === 'ORG_ADMIN' && job?.organizationId === organizationId) canView = true;
  else if (role === 'HIRING_MANAGER' && job?.departmentId === departmentId) canView = true;
  else if (role === 'RECRUITER' && job?.organizationId === organizationId) canView = true;

  if (!job || !canView) {
    return reply.code(403).send({ error: 'Forbidden' });
  }

  const applications = await prisma.application.findMany({
    where: { jobId },
    include: { applicant: { include: { profile: true } } },
    orderBy: { matchScore: 'desc' },
  });

  // Blind screening: redact identifying info when enabled
  if (job.blindScreening) {
    return applications.map((app: any, i: number) => ({
      ...app,
      applicant: {
        ...app.applicant,
        name: `Candidate ${i + 1}`,
        email: `candidate-${i + 1}@redacted`,
        profile: app.applicant.profile ? {
          ...app.applicant.profile,
          resumeUrl: undefined,
          resumeFileUrl: undefined,
        } : null,
      },
    }));
  }

  return applications;
});

// Update application status — with notification
server.patch('/api/applications/:appId/status', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { appId } = request.params as any;
  const { status } = request.body as any;
  const validStatuses = ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'];
  if (!validStatuses.includes(status)) {
    return reply.code(400).send({ error: 'Invalid status' });
  }

  const app = await prisma.application.update({
    where: { id: appId },
    data: { status },
    include: { job: true, applicant: true },
  });

  // Notify the applicant about status change
  const statusLabels: Record<string, string> = {
    REVIEWING: 'is being reviewed',
    SHORTLISTED: 'has been shortlisted! 🎉',
    REJECTED: 'was not selected',
    HIRED: 'resulted in an offer! 🎉🎉',
  };
  if (statusLabels[status]) {
    await createNotification(
      app.applicantId,
      'STATUS_CHANGE',
      'Application Update',
      `Your application for "${app.job.title}" ${statusLabels[status]}`,
      '/'
    );

    // Email notification
    if (app.applicant?.email) {
      const email = statusChangeEmail(app.applicant.name || 'there', app.job.title, status);
      sendEmail({ to: app.applicant.email, ...email });
    }
  }

  // Workflow Engine (Phase 4): Process Workflow Triggers
  const triggers = await prisma.workflowTrigger.findMany({
    where: { jobId: app.jobId, event: 'STAGE_ENTERED', isActive: true },
  });

  for (const trigger of triggers) {
    // If the trigger specifically looks for the new stage (e.g. 'Technical' -> 'INTERVIEW' or similar mapped states)
    // For this implementation, we will match if trigger.stageName matches the new status OR if it maps conceptually.
    const isMatch = trigger.stageName?.toUpperCase() === status.toUpperCase() ||
                    (trigger.stageName === 'Technical' && status === 'INTERVIEW') ||
                    (!trigger.stageName);
    
    if (isMatch) {
      if (trigger.actionType === 'SEND_SLACK_NOTIF') {
        const channel = (trigger.metadata as any)?.channel || '#general';
        console.log(`\n[WORKFLOW ENGINE 🚀] Sending Mock Slack Notification`);
        console.log(`   └ To Channel: ${channel}`);
        console.log(`   └ Message: Candidate ${app.applicant.name || app.applicant.email} moved to ${status} for ${app.job.title}`);
        
        // Log the automation to candidate activity log
        await prisma.activity.create({
          data: {
            applicationId: appId,
            actorId: null, // System action
            type: 'SYSTEM_AUTOMATION',
            title: `Automated Slack Notification triggered`,
            description: `Sent payload to ${channel}`,
            metadata: { triggerId: trigger.id, channel },
          }
        });
      }
      if (trigger.actionType === 'SEND_EMAIL') {
        console.log(`[WORKFLOW ENGINE 🚀] Sending Automated Template Email to Candidate...`);
      }
    }
  }

  // Activity log
  const { id: actorId } = (request as any).user;
  await prisma.activity.create({
    data: {
      applicationId: appId,
      actorId,
      type: 'STATUS_CHANGE',
      title: `Status changed to ${status}`,
      metadata: { from: app.status, to: status },
    },
  });

  return app;
});

// ═══════════════════════════════════════════════════════════════════════════════
// JOB SEEKER FEED & APPLY
// ═══════════════════════════════════════════════════════════════════════════════

server.get('/api/jobs', async (request) => {
  const { search, location, page, skills, minExp, maxExp, seniority, industry } = request.query as any;
  const pageNum = parseInt(page) || 1;
  const pageSize = 20;

  const where: any = { isActive: true };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }
  // Advanced: filter by required skills (comma-separated)
  if (skills) {
    const skillList = skills.split(',').map((s: string) => s.trim());
    where.skillsRequired = { hasSome: skillList };
  }
  // Advanced: filter by seniority
  if (seniority) {
    where.seniority = { equals: seniority, mode: 'insensitive' };
  }
  // Advanced: filter by industry
  if (industry) {
    where.industry = { contains: industry, mode: 'insensitive' };
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { recruiter: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page: pageNum, totalPages: Math.ceil(total / pageSize) };
});

server.get('/api/public/organization/:orgId', async (request, reply) => {
  const { orgId } = request.params as any;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, settings: true, logoUrl: true, domain: true, website: true },
  });
  if (!org) return reply.code(404).send({ error: 'Org not found' });
  return org;
});

server.get('/api/jobs/:jobId', async (request) => {
  const { jobId } = request.params as any;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { recruiter: { select: { name: true, email: true } } },
  });
  return job || { error: 'Job not found' };
});

// 1-click apply — with notification to recruiter
server.post('/api/jobs/:jobId/apply', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { jobId } = request.params as any;
  const { id: applicantId } = (request as any).user;

  const existing = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId } },
  });
  if (existing) {
    return reply.code(409).send({ error: 'Already applied to this job' });
  }

  let matchScore: number | null = null;
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: applicantId } });
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (profile && job) {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const res = await fetch(`${aiUrl}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: `Skills: ${profile.skills.join(', ')}. Experience: ${profile.experienceYears} years. Education: ${profile.educationTier}`,
          job_description: `${job.title}. ${job.description}. Required: ${job.skillsRequired.join(', ')}`,
        }),
      });
      const result = await res.json();
      matchScore = result.score || null;
    }
  } catch (err) {
    server.log.warn('AI matching unavailable, applying without score');
  }

  const application = await prisma.application.create({
    data: { jobId, applicantId, matchScore },
  });

  // Notify the recruiter (in-app)
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { recruiter: true } });
  const applicant = await prisma.user.findUnique({ where: { id: applicantId } });
  if (job) {
    await createNotification(
      job.recruiterId,
      'NEW_APPLICATION',
      'New Application',
      `${applicant?.name || applicant?.email || 'Someone'} applied to "${job.title}"${matchScore ? ` (${Math.round(matchScore * 100)}% match)` : ''}`,
      `/candidates/${jobId}`
    );

    // Email notifications (fire-and-forget)
    if (applicant?.email) {
      const confirmEmail = applicationConfirmationEmail(
        applicant.name || 'there',
        job.title,
        job.recruiter?.name || 'the company'
      );
      sendEmail({ to: applicant.email, ...confirmEmail });
    }
    if (job.recruiter?.email) {
      const recruiterEmail = newApplicationEmail(
        job.recruiter.name || 'Recruiter',
        applicant?.name || applicant?.email || 'Someone',
        job.title,
        matchScore ?? undefined
      );
      sendEmail({ to: job.recruiter.email, ...recruiterEmail });
    }

    // Activity log
    await prisma.activity.create({
      data: {
        applicationId: application.id,
        actorId: applicantId,
        type: 'APPLICATION_SUBMITTED',
        title: 'Application submitted',
        description: matchScore ? `AI Match Score: ${Math.round(matchScore * 100)}%` : undefined,
      },
    });
  }

  return application;
});

server.get('/api/applications/mine', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  const applications = await prisma.application.findMany({
    where: { applicantId: id },
    include: { job: { include: { recruiter: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return applications;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: INTERVIEW SCHEDULING
// ═══════════════════════════════════════════════════════════════════════════════

server.post('/api/interviews', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { role } = (request as any).user;
  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Only recruiters can schedule interviews' });
  }

  const { applicationId, scheduledAt, durationMinutes, type, meetingLink, notes } = request.body as any;
  if (!applicationId || !scheduledAt) {
    return reply.code(400).send({ error: 'applicationId and scheduledAt are required' });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application) {
    return reply.code(404).send({ error: 'Application not found' });
  }

  const interview = await prisma.interview.create({
    data: {
      applicationId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes || 30,
      type: type || 'VIDEO',
      meetingLink: meetingLink || null,
      notes: notes || null,
    },
  });

  // Auto-update application status
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'INTERVIEW' },
  });

  // Notify the candidate
  await createNotification(
    application.applicantId,
    'INTERVIEW_SCHEDULED',
    'Interview Scheduled! 🎯',
    `You have an interview for "${application.job.title}" on ${new Date(scheduledAt).toLocaleDateString()} at ${new Date(scheduledAt).toLocaleTimeString()}`,
    '/interviews'
  );

  return interview;
});

server.get('/api/interviews/mine', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id, role } = (request as any).user;

  if (role === 'RECRUITER') {
    return prisma.interview.findMany({
      where: { application: { job: { recruiterId: id } } },
      include: {
        application: {
          include: {
            applicant: { select: { id: true, name: true, email: true } },
            job: { select: { id: true, title: true, location: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  } else {
    return prisma.interview.findMany({
      where: { application: { applicantId: id } },
      include: {
        application: {
          include: {
            job: { include: { recruiter: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
});

server.patch('/api/interviews/:interviewId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { interviewId } = request.params as any;
  const { status, scheduledAt, meetingLink, notes } = request.body as any;

  const data: any = {};
  if (status) data.status = status;
  if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
  if (meetingLink !== undefined) data.meetingLink = meetingLink;
  if (notes !== undefined) data.notes = notes;

  const interview = await prisma.interview.update({
    where: { id: interviewId },
    data,
    include: { application: { include: { job: true } } },
  });

  if (status === 'CANCELLED') {
    await createNotification(
      interview.application.applicantId,
      'INTERVIEW_CANCELLED',
      'Interview Cancelled',
      `Your interview for "${interview.application.job.title}" has been cancelled`,
      '/interviews'
    );
  }

  return interview;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

server.get('/api/notifications', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  return prisma.notification.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
});

server.get('/api/notifications/unread-count', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  const count = await prisma.notification.count({ where: { userId: id, isRead: false } });
  return { count };
});

server.patch('/api/notifications/:notifId/read', { preHandler: [server.authenticate as any] }, async (request) => {
  const { notifId } = request.params as any;
  return prisma.notification.update({ where: { id: notifId }, data: { isRead: true } });
});

server.patch('/api/notifications/read-all', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  await prisma.notification.updateMany({ where: { userId: id, isRead: false }, data: { isRead: true } });
  return { success: true };
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: ANALYTICS (RECRUITER)
// ═══════════════════════════════════════════════════════════════════════════════

server.get('/api/analytics/dashboard', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id, role } = (request as any).user;
  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Analytics available for recruiters only' });
  }

  const jobs = await prisma.job.findMany({
    where: { recruiterId: id },
    include: {
      applications: { select: { status: true, matchScore: true, createdAt: true } },
    },
  });

  const allApps = jobs.flatMap(j => j.applications);

  const funnel = {
    applied: allApps.filter(a => a.status === 'APPLIED').length,
    reviewing: allApps.filter(a => a.status === 'REVIEWING').length,
    shortlisted: allApps.filter(a => a.status === 'SHORTLISTED').length,
    interview: allApps.filter(a => a.status === 'INTERVIEW').length,
    hired: allApps.filter(a => a.status === 'HIRED').length,
    rejected: allApps.filter(a => a.status === 'REJECTED').length,
    total: allApps.length,
  };

  const weeklyTrend: { week: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = allApps.filter(a => {
      const d = new Date(a.createdAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    weeklyTrend.push({
      week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    });
  }

  const skillCounts: Record<string, number> = {};
  jobs.forEach(j => {
    j.skillsRequired.forEach(s => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });
  const skillDemand = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  const jobStats = jobs.map(j => {
    const scores = j.applications.filter(a => a.matchScore != null).map(a => a.matchScore!);
    return {
      jobId: j.id,
      title: j.title,
      applicants: j.applications.length,
      avgMatch: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : 0,
    };
  });

  return { funnel, weeklyTrend, skillDemand, jobStats };
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

server.patch('/api/settings/profile', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  const { name, companyName, companyWebsite, companyDesc } = request.body as any;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (companyName !== undefined) data.companyName = companyName;
  if (companyWebsite !== undefined) data.companyWebsite = companyWebsite;
  if (companyDesc !== undefined) data.companyDesc = companyDesc;

  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, companyName: true, companyWebsite: true, companyDesc: true },
  });
});

server.patch('/api/settings/password', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id } = (request as any).user;
  const { currentPassword, newPassword } = request.body as any;

  if (!currentPassword || !newPassword) {
    return reply.code(400).send({ error: 'Both current and new passwords are required' });
  }
  if (newPassword.length < 6) {
    return reply.code(400).send({ error: 'New password must be at least 6 characters' });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return reply.code(404).send({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return reply.code(401).send({ error: 'Current password is incorrect' });
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  return { success: true, message: 'Password changed successfully' };
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3A: PDF RESUME UPLOAD & PARSE
// ═══════════════════════════════════════════════════════════════════════════════

server.post('/api/profiles/upload-resume', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id } = (request as any).user;

  const data = await request.file();
  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  const allowedTypes = ['application/pdf', 'text/plain'];
  if (!allowedTypes.includes(data.mimetype)) {
    return reply.code(400).send({ error: 'Only PDF and TXT files are supported' });
  }

  // Read file buffer
  const chunks: Buffer[] = [];
  for await (const chunk of data.file) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // Save to uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const fileName = `${id}_${Date.now()}_${data.filename}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, buffer);

  // Extract text from PDF
  let extractedText = '';
  if (data.mimetype === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } catch (err) {
      server.log.error('PDF parse failed:', err);
      extractedText = '';
    }
  } else {
    extractedText = buffer.toString('utf-8');
  }

  // Send to AI parser for skill extraction
  let parsedData: any = null;
  if (extractedText) {
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const res = await fetch(`${aiUrl}/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: extractedText }),
      });
      parsedData = await res.json();
    } catch (err) {
      server.log.warn('AI parser unavailable');
    }
  }

  // Update profile with file URL and extracted data
  const updateData: any = {
    resumeFileUrl: `/uploads/${fileName}`,
    resumeText: extractedText.substring(0, 10000), // cap stored text
  };
  if (parsedData?.skills?.length) updateData.skills = parsedData.skills;
  if (parsedData?.experience_years) updateData.experienceYears = parsedData.experience_years;
  if (parsedData?.education) updateData.educationTier = parsedData.education;

  const profile = await prisma.profile.upsert({
    where: { userId: id },
    create: { userId: id, ...updateData },
    update: updateData,
  });

  return { profile, parsed: parsedData, extractedTextLength: extractedText.length };
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3A: INTERVIEW SCORECARDS
// ═══════════════════════════════════════════════════════════════════════════════

// Submit a scorecard for an interview
server.post('/api/scorecards', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id: evaluatorId } = (request as any).user;
  const {
    interviewId, technicalScore, communicationScore,
    problemSolvingScore, cultureFitScore, overallScore,
    strengths, weaknesses, recommendation, notes,
  } = request.body as any;

  if (!interviewId) {
    return reply.code(400).send({ error: 'interviewId is required' });
  }

  const scorecard = await prisma.scorecard.create({
    data: {
      interviewId,
      evaluatorId,
      technicalScore, communicationScore,
      problemSolvingScore, cultureFitScore, overallScore,
      strengths, weaknesses, recommendation, notes,
    },
  });

  // Activity log
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: true },
  });
  if (interview) {
    await prisma.activity.create({
      data: {
        applicationId: interview.applicationId,
        actorId: evaluatorId,
        type: 'SCORECARD_SUBMITTED',
        title: 'Interview scorecard submitted',
        description: `Overall: ${overallScore}/5, Recommendation: ${recommendation}`,
      },
    });
  }

  return scorecard;
});

// Get scorecards for an interview
server.get('/api/scorecards/:interviewId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { interviewId } = request.params as any;
  return prisma.scorecard.findMany({
    where: { interviewId },
    orderBy: { createdAt: 'desc' },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3A: CANDIDATE ACTIVITY LOG
// ═══════════════════════════════════════════════════════════════════════════════

// Get activity log for an application
server.get('/api/activities/:applicationId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { applicationId } = request.params as any;
  return prisma.activity.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' },
  });
});

// Add a manual note to an application
server.post('/api/activities', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id: actorId } = (request as any).user;
  const { applicationId, title, description } = request.body as any;

  if (!applicationId || !title) {
    return reply.code(400).send({ error: 'applicationId and title are required' });
  }

  return prisma.activity.create({
    data: {
      applicationId,
      actorId,
      type: 'NOTE',
      title,
      description,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3A: CUSTOMIZABLE PIPELINE STAGES
// ═══════════════════════════════════════════════════════════════════════════════

// Get pipeline stages for a job
server.get('/api/pipeline-stages/:jobId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { jobId } = request.params as any;
  const stages = await prisma.pipelineStage.findMany({
    where: { jobId },
    orderBy: { order: 'asc' },
  });

  // Return defaults if none exist
  if (stages.length === 0) {
    return [
      { id: 'default-applied', name: 'Applied', color: '#6366f1', order: 0, isDefault: true },
      { id: 'default-reviewing', name: 'Reviewing', color: '#f59e0b', order: 1, isDefault: true },
      { id: 'default-shortlisted', name: 'Shortlisted', color: '#10b981', order: 2, isDefault: true },
      { id: 'default-interview', name: 'Interview', color: '#06b6d4', order: 3, isDefault: true },
      { id: 'default-hired', name: 'Hired', color: '#22c55e', order: 4, isDefault: true },
      { id: 'default-rejected', name: 'Rejected', color: '#ef4444', order: 5, isDefault: true },
    ];
  }
  return stages;
});

// Create a pipeline stage
server.post('/api/pipeline-stages', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { jobId, name, color, order } = request.body as any;
  if (!jobId || !name) {
    return reply.code(400).send({ error: 'jobId and name are required' });
  }

  return prisma.pipelineStage.create({
    data: { jobId, name, color: color || '#6366f1', order: order || 0 },
  });
});

// Update a pipeline stage
server.patch('/api/pipeline-stages/:stageId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { stageId } = request.params as any;
  const { name, color, order } = request.body as any;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (color !== undefined) data.color = color;
  if (order !== undefined) data.order = order;

  return prisma.pipelineStage.update({ where: { id: stageId }, data });
});

// Delete a pipeline stage
server.delete('/api/pipeline-stages/:stageId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { stageId } = request.params as any;
  await prisma.pipelineStage.delete({ where: { id: stageId } });
  return { success: true };
});

// Bulk update pipeline stages (reorder)
server.put('/api/pipeline-stages/:jobId/reorder', { preHandler: [server.authenticate as any] }, async (request) => {
  const { stages } = request.body as any; // [{ id, order }]
  if (!Array.isArray(stages)) return { error: 'stages must be an array' };

  await Promise.all(
    stages.map((s: { id: string; order: number }) =>
      prisma.pipelineStage.update({ where: { id: s.id }, data: { order: s.order } })
    )
  );
  return { success: true };
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTERVIEW AI COPILOT
// ═══════════════════════════════════════════════════════════════════════════════

server.post('/api/interviews/generate-questions', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { jobId, candidateId } = request.body as any;

  // Fetch job details
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return reply.code(404).send({ error: 'Job not found' });

  // Fetch candidate profile if provided
  let candidateSkills: string[] = [];
  if (candidateId) {
    const profile = await prisma.profile.findUnique({ where: { userId: candidateId } });
    if (profile?.skills) candidateSkills = profile.skills;
  }

  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const res = await fetch(`${aiUrl}/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_title: job.title,
        skills: job.skillsRequired || [],
        seniority: job.seniority || 'MID',
        candidate_skills: candidateSkills,
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    // Fallback: Generate static questions from skills
    const skills = job.skillsRequired || [];
    const questions = skills.slice(0, 5).flatMap((skill: string) => [
      { question: `Tell me about your experience with ${skill}.`, category: 'Technical', difficulty: 'Medium', time_estimate: '5 min', follow_ups: [] },
      { question: `How would you design a system using ${skill} at scale?`, category: 'System Design', difficulty: 'Hard', time_estimate: '8 min', follow_ups: [] },
    ]);
    questions.push(
      { question: 'Tell me about a challenging project you led.', category: 'Behavioral', difficulty: 'Medium', time_estimate: '5 min', follow_ups: [] },
      { question: 'How do you handle disagreements in a team setting?', category: 'Culture Fit', difficulty: 'Medium', time_estimate: '3 min', follow_ups: [] },
    );
    return { job_title: job.title, seniority: job.seniority || 'MID', questions, fallback: true };
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC CAREER SITE API (NO AUTH)
// ═══════════════════════════════════════════════════════════════════════════════

// Public job listing for embeddable career sites
server.get('/api/public/jobs', async (request) => {
  const { company, search, location } = request.query as any;

  const where: any = { isActive: true };
  if (company) {
    where.organization = { name: { contains: company, mode: 'insensitive' } };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  const jobs = await prisma.job.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      skillsRequired: true,
      location: true,
      salaryRange: true,
      seniority: true,
      industry: true,
      createdAt: true,
      organization: {
        select: {
          name: true,
          website: true,
          description: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return {
    company: company || 'All companies',
    count: jobs.length,
    jobs,
  };
});

// Public single job detail
server.get('/api/public/jobs/:jobId', async (request, reply) => {
  const { jobId } = request.params as any;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      description: true,
      skillsRequired: true,
      location: true,
      salaryRange: true,
      seniority: true,
      industry: true,
      createdAt: true,
      recruiter: {
        select: {
          companyName: true,
          companyWebsite: true,
          companyDesc: true,
        },
      },
    },
  });
  if (!job) return reply.code(404).send({ error: 'Job not found' });
  return job;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3B: EMPLOYEE REFERRAL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

// Submit a referral
server.post('/api/referrals', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id: referrerId } = (request as any).user;
  const { jobId, candidateName, candidateEmail, notes } = request.body as any;

  if (!jobId || !candidateName || !candidateEmail) {
    return reply.code(400).send({ error: 'jobId, candidateName, and candidateEmail are required' });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { recruiter: true } });
  if (!job) return reply.code(404).send({ error: 'Job not found' });

  const referral = await prisma.referral.create({
    data: { referrerId, jobId, candidateName, candidateEmail, notes },
  });

  // Send invite email to the candidate
  const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
  const email = referralInviteEmail(
    referrer?.name || 'A team member',
    candidateName,
    job.title,
    job.recruiter?.companyName || 'our company'
  );
  sendEmail({ to: candidateEmail, ...email });

  // Notify recruiter
  await createNotification(
    job.recruiterId,
    'NEW_REFERRAL',
    'New Referral Submitted',
    `${referrer?.name || 'Someone'} referred ${candidateName} for "${job.title}"`,
    '/referrals'
  );

  return referral;
});

// Get my referrals
server.get('/api/referrals/mine', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  return prisma.referral.findMany({
    where: { referrerId: id },
    include: { job: { select: { title: true, location: true } } },
    orderBy: { createdAt: 'desc' },
  });
});

// Referral stats / leaderboard (recruiter)
server.get('/api/referrals/stats', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { role } = (request as any).user;
  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Recruiter only' });
  }

  const referrals = await prisma.referral.findMany({
    include: { referrer: { select: { id: true, name: true, email: true } }, job: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Build leaderboard
  const leaderboard: Record<string, { name: string; count: number; hired: number }> = {};
  referrals.forEach(r => {
    const key = r.referrerId;
    if (!leaderboard[key]) {
      leaderboard[key] = { name: r.referrer.name || r.referrer.email, count: 0, hired: 0 };
    }
    leaderboard[key].count++;
    if (r.status === 'HIRED') leaderboard[key].hired++;
  });

  const topReferrers = Object.entries(leaderboard)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const statusBreakdown = {
    pending: referrals.filter(r => r.status === 'PENDING').length,
    contacted: referrals.filter(r => r.status === 'CONTACTED').length,
    applied: referrals.filter(r => r.status === 'APPLIED').length,
    interviewing: referrals.filter(r => r.status === 'INTERVIEWING').length,
    hired: referrals.filter(r => r.status === 'HIRED').length,
    rejected: referrals.filter(r => r.status === 'REJECTED').length,
    total: referrals.length,
  };

  return { referrals, topReferrers, statusBreakdown };
});

// Update referral status
server.patch('/api/referrals/:id/status', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id } = request.params as any;
  const { status } = request.body as any;
  const validStatuses = ['PENDING', 'CONTACTED', 'APPLIED', 'INTERVIEWING', 'HIRED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    return reply.code(400).send({ error: 'Invalid status' });
  }

  const referral = await prisma.referral.update({
    where: { id },
    data: { status },
    include: { referrer: true, job: true },
  });

  // Notify the referrer
  if (referral.referrer) {
    await createNotification(
      referral.referrerId,
      'REFERRAL_UPDATE',
      'Referral Update',
      `Your referral ${referral.candidateName} for "${referral.job.title}" is now: ${status}`,
      '/referrals'
    );

    if (referral.referrer.email) {
      const email = referralStatusEmail(
        referral.referrer.name || 'there',
        referral.candidateName,
        referral.job.title,
        status
      );
      sendEmail({ to: referral.referrer.email, ...email });
    }
  }

  return referral;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3B: OFFER LETTER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Create a draft offer
server.post('/api/offers', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { role } = (request as any).user;
  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Only recruiters can create offers' });
  }

  const { applicationId, salary, currency, startDate, expiresAt, benefits, jobTitle } = request.body as any;
  if (!applicationId || !salary || !startDate || !expiresAt || !jobTitle) {
    return reply.code(400).send({ error: 'applicationId, salary, startDate, expiresAt, and jobTitle are required' });
  }

  const existing = await prisma.offerLetter.findUnique({ where: { applicationId } });
  if (existing) {
    return reply.code(409).send({ error: 'An offer already exists for this application' });
  }

  const offer = await prisma.offerLetter.create({
    data: {
      applicationId,
      salary: parseFloat(salary),
      currency: currency || 'USD',
      startDate: new Date(startDate),
      expiresAt: new Date(expiresAt),
      benefits: benefits || null,
      jobTitle,
    },
  });

  return offer;
});

// Get all offers (recruiter)
server.get('/api/offers/mine', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id, role } = (request as any).user;

  if (role === 'RECRUITER') {
    return prisma.offerLetter.findMany({
      where: { application: { job: { recruiterId: id } } },
      include: {
        application: {
          include: {
            applicant: { select: { id: true, name: true, email: true } },
            job: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // Job seeker: see offers sent to them
    return prisma.offerLetter.findMany({
      where: { application: { applicantId: id }, status: { in: ['SENT', 'ACCEPTED', 'DECLINED'] } },
      include: {
        application: {
          include: {
            job: { include: { recruiter: { select: { name: true, companyName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
});

// Get single offer
server.get('/api/offers/:offerId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { offerId } = request.params as any;
  return prisma.offerLetter.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: {
          applicant: { select: { id: true, name: true, email: true } },
          job: { include: { recruiter: { select: { name: true, companyName: true } } } },
        },
      },
    },
  });
});

// Approve an offer
server.patch('/api/offers/:offerId/approve', { preHandler: [server.authenticate as any] }, async (request) => {
  const { offerId } = request.params as any;
  const { id: approvedById } = (request as any).user;
  return prisma.offerLetter.update({
    where: { id: offerId },
    data: { status: 'APPROVED', approvedById },
  });
});

// Send offer to candidate
server.patch('/api/offers/:offerId/send', { preHandler: [server.authenticate as any] }, async (request) => {
  const { offerId } = request.params as any;

  const offer = await prisma.offerLetter.update({
    where: { id: offerId },
    data: { status: 'SENT' },
    include: {
      application: {
        include: {
          applicant: true,
          job: true,
        },
      },
    },
  });

  // Update application status
  await prisma.application.update({
    where: { id: offer.applicationId },
    data: { status: 'HIRED' },
  });

  // Notify candidate
  await createNotification(
    offer.application.applicantId,
    'OFFER_RECEIVED',
    'You Received an Offer! 🎉',
    `Congratulations! You have a formal offer for "${offer.jobTitle}"`,
    '/offers'
  );

  // Send email
  if (offer.application.applicant?.email) {
    const salaryStr = `${offer.currency} ${offer.salary.toLocaleString()}`;
    const email = offerLetterEmail(
      offer.application.applicant.name || 'there',
      offer.jobTitle,
      salaryStr,
      new Date(offer.startDate).toLocaleDateString(),
      new Date(offer.expiresAt).toLocaleDateString()
    );
    sendEmail({ to: offer.application.applicant.email, ...email });
  }

  // Activity log
  await prisma.activity.create({
    data: {
      applicationId: offer.applicationId,
      actorId: (request as any).user.id,
      type: 'OFFER_SENT',
      title: 'Offer letter sent to candidate',
      description: `${offer.currency} ${offer.salary.toLocaleString()} — starts ${new Date(offer.startDate).toLocaleDateString()}`,
    },
  });

  return offer;
});

// Candidate responds to offer
server.patch('/api/offers/:offerId/respond', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { offerId } = request.params as any;
  const { response, candidateNotes } = request.body as any;
  const { id: userId } = (request as any).user;

  if (!['ACCEPTED', 'DECLINED'].includes(response)) {
    return reply.code(400).send({ error: 'Response must be ACCEPTED or DECLINED' });
  }

  const offer = await prisma.offerLetter.update({
    where: { id: offerId },
    data: { status: response, candidateNotes: candidateNotes || null },
    include: {
      application: {
        include: {
          applicant: true,
          job: { include: { recruiter: true } },
        },
      },
    },
  });

  // Notify recruiter
  if (offer.application.job.recruiterId) {
    await createNotification(
      offer.application.job.recruiterId,
      'OFFER_RESPONSE',
      `Offer ${response === 'ACCEPTED' ? 'Accepted! 🎉' : 'Declined'}`,
      `${offer.application.applicant.name || 'Candidate'} has ${response.toLowerCase()} the offer for "${offer.jobTitle}"`,
      '/offers'
    );

    if (offer.application.job.recruiter?.email) {
      const email = offerResponseEmail(
        offer.application.job.recruiter.name || 'Recruiter',
        offer.application.applicant.name || 'Candidate',
        offer.jobTitle,
        response === 'ACCEPTED'
      );
      sendEmail({ to: offer.application.job.recruiter.email, ...email });
    }
  }

  // Activity log
  await prisma.activity.create({
    data: {
      applicationId: offer.applicationId,
      actorId: userId,
      type: 'OFFER_RESPONSE',
      title: `Candidate ${response.toLowerCase()} the offer`,
      description: candidateNotes || undefined,
    },
  });

  return offer;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3B: DEI & COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════

// Submit demographic data (voluntary, by candidate)
server.post('/api/demographics', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { applicationId, gender, ethnicity, veteranStatus, disabilityStatus } = request.body as any;
  if (!applicationId) {
    return reply.code(400).send({ error: 'applicationId is required' });
  }

  const demographics = await prisma.demographicData.upsert({
    where: { applicationId },
    create: { applicationId, gender, ethnicity, veteranStatus, disabilityStatus },
    update: { gender, ethnicity, veteranStatus, disabilityStatus },
  });

  return demographics;
});

// Toggle blind screening for a job
server.patch('/api/jobs/:jobId/blind-screening', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { jobId } = request.params as any;
  const { enabled } = request.body as any;
  const { id, role } = (request as any).user;

  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Only recruiters can toggle blind screening' });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.recruiterId !== id) {
    return reply.code(403).send({ error: 'Forbidden' });
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { blindScreening: !!enabled },
  });
});

// Aggregated DEI analytics (fully anonymized)
server.get('/api/analytics/dei', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id, role } = (request as any).user;
  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Recruiter only' });
  }

  const jobs = await prisma.job.findMany({
    where: { recruiterId: id },
    select: { id: true },
  });
  const jobIds = jobs.map(j => j.id);

  const demographics = await prisma.demographicData.findMany({
    where: { application: { jobId: { in: jobIds } } },
  });

  // Aggregate — no individual data exposed
  const genderCounts: Record<string, number> = {};
  const ethnicityCounts: Record<string, number> = {};
  const veteranCounts: Record<string, number> = {};
  const disabilityCounts: Record<string, number> = {};

  demographics.forEach(d => {
    if (d.gender) genderCounts[d.gender] = (genderCounts[d.gender] || 0) + 1;
    if (d.ethnicity) ethnicityCounts[d.ethnicity] = (ethnicityCounts[d.ethnicity] || 0) + 1;
    if (d.veteranStatus) veteranCounts[d.veteranStatus] = (veteranCounts[d.veteranStatus] || 0) + 1;
    if (d.disabilityStatus) disabilityCounts[d.disabilityStatus] = (disabilityCounts[d.disabilityStatus] || 0) + 1;
  });

  // Hiring funnel by demographics
  const apps = await prisma.application.findMany({
    where: { jobId: { in: jobIds } },
    select: { status: true, demographics: true },
  });

  const totalApps = apps.length;
  const hired = apps.filter(a => a.status === 'HIRED').length;
  const withDemographics = apps.filter(a => a.demographics).length;

  return {
    totalApplications: totalApps,
    totalHired: hired,
    responseRate: totalApps > 0 ? Math.round((withDemographics / totalApps) * 100) : 0,
    gender: Object.entries(genderCounts).map(([label, count]) => ({ label, count })),
    ethnicity: Object.entries(ethnicityCounts).map(([label, count]) => ({ label, count })),
    veteranStatus: Object.entries(veteranCounts).map(([label, count]) => ({ label, count })),
    disabilityStatus: Object.entries(disabilityCounts).map(([label, count]) => ({ label, count })),
  };
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3B: CANDIDATE NURTURE SEQUENCES
// ═══════════════════════════════════════════════════════════════════════════════

// Create a nurture sequence
server.post('/api/nurture-sequences', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { id: recruiterId, role } = (request as any).user;
  if (role !== 'RECRUITER') {
    return reply.code(403).send({ error: 'Only recruiters can create nurture sequences' });
  }

  const { name, description } = request.body as any;
  if (!name) {
    return reply.code(400).send({ error: 'name is required' });
  }

  return prisma.nurtureSequence.create({
    data: { name, description, recruiterId },
  });
});

// List my nurture sequences
server.get('/api/nurture-sequences', { preHandler: [server.authenticate as any] }, async (request) => {
  const { id } = (request as any).user;
  return prisma.nurtureSequence.findMany({
    where: { recruiterId: id },
    include: {
      steps: { orderBy: { order: 'asc' } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
});

// Get single sequence with steps and enrollments
server.get('/api/nurture-sequences/:seqId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { seqId } = request.params as any;
  return prisma.nurtureSequence.findUnique({
    where: { id: seqId },
    include: {
      steps: { orderBy: { order: 'asc' } },
      enrollments: { orderBy: { createdAt: 'desc' } },
    },
  });
});

// Add a step to a sequence
server.post('/api/nurture-sequences/:seqId/steps', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { seqId } = request.params as any;
  const { subject, body, delayDays, order } = request.body as any;

  if (!subject || !body) {
    return reply.code(400).send({ error: 'subject and body are required' });
  }

  return prisma.nurtureStep.create({
    data: {
      sequenceId: seqId,
      subject,
      body,
      delayDays: delayDays || 1,
      order: order || 0,
    },
  });
});

// Delete a step
server.delete('/api/nurture-steps/:stepId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { stepId } = request.params as any;
  await prisma.nurtureStep.delete({ where: { id: stepId } });
  return { success: true };
});

// Enroll a candidate in a sequence
server.post('/api/nurture-sequences/:seqId/enroll', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { seqId } = request.params as any;
  const { candidateEmail, candidateName } = request.body as any;

  if (!candidateEmail) {
    return reply.code(400).send({ error: 'candidateEmail is required' });
  }

  const sequence = await prisma.nurtureSequence.findUnique({
    where: { id: seqId },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
  if (!sequence || sequence.steps.length === 0) {
    return reply.code(400).send({ error: 'Sequence has no steps' });
  }

  const nextSendAt = new Date();
  nextSendAt.setDate(nextSendAt.getDate() + sequence.steps[0].delayDays);

  return prisma.nurtureEnrollment.create({
    data: {
      sequenceId: seqId,
      candidateEmail,
      candidateName: candidateName || null,
      nextSendAt,
    },
  });
});

// Toggle sequence active/inactive
server.patch('/api/nurture-sequences/:seqId/toggle', { preHandler: [server.authenticate as any] }, async (request) => {
  const { seqId } = request.params as any;
  const seq = await prisma.nurtureSequence.findUnique({ where: { id: seqId } });
  return prisma.nurtureSequence.update({
    where: { id: seqId },
    data: { isActive: !seq?.isActive },
  });
});

// Process nurture emails (cron-style endpoint)
server.post('/api/nurture-sequences/process', async () => {
  const now = new Date();
  const dueEnrollments = await prisma.nurtureEnrollment.findMany({
    where: {
      status: 'ACTIVE',
      nextSendAt: { lte: now },
    },
    include: {
      sequence: {
        include: { steps: { orderBy: { order: 'asc' } } },
      },
    },
  });

  let sent = 0;
  for (const enrollment of dueEnrollments) {
    const step = enrollment.sequence.steps[enrollment.currentStep];
    if (!step) {
      // All steps completed
      await prisma.nurtureEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'COMPLETED' },
      });
      continue;
    }

    // Send the email
    const email = nurtureEmail(
      enrollment.candidateName || 'there',
      step.subject,
      step.body
    );
    await sendEmail({ to: enrollment.candidateEmail, ...email });
    sent++;

    // Advance to next step
    const nextStepIndex = enrollment.currentStep + 1;
    const nextStep = enrollment.sequence.steps[nextStepIndex];

    if (nextStep) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextStep.delayDays);
      await prisma.nurtureEnrollment.update({
        where: { id: enrollment.id },
        data: { currentStep: nextStepIndex, lastSentAt: now, nextSendAt: nextDate },
      });
    } else {
      await prisma.nurtureEnrollment.update({
        where: { id: enrollment.id },
        data: { currentStep: nextStepIndex, lastSentAt: now, status: 'COMPLETED', nextSendAt: null },
      });
    }
  }

  return { processed: dueEnrollments.length, sent };
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: ENTERPRISE CONNECTIVITY & AUTOMATION (ORGANIZATIONS / WORKFLOW)
// ═══════════════════════════════════════════════════════════════════════════════

server.get('/api/organization', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { organizationId } = (request as any).user;
  if (!organizationId) return reply.code(404).send({ error: 'No organization linked' });
  
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      departments: true,
      users: {
        select: { id: true, email: true, name: true, role: true, departmentId: true, department: { select: { name: true } } }
      }
    }
  });
});

server.post('/api/organization/departments', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { organizationId, role } = (request as any).user;
  if (role !== 'ORG_ADMIN') return reply.code(403).send({ error: 'Only Admins can manage departments' });
  
  const { name } = request.body as any;
  if (!name) return reply.code(400).send({ error: 'Department name required' });
  
  return prisma.department.create({
    data: { name, organizationId }
  });
});

server.post('/api/organization/invite', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { organizationId, role: myRole } = (request as any).user;
  if (myRole !== 'ORG_ADMIN') return reply.code(403).send({ error: 'Only Admins can invite teammates' });
  
  const { email, name, role, departmentId } = request.body as any;
  if (!email || !role) return reply.code(400).send({ error: 'email and role required' });
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return reply.code(400).send({ error: 'User already exists globally' });
  
  const passwordHash = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: role,
      organizationId,
      departmentId: departmentId || null
    }
  });
});

server.patch('/api/organization/settings', { preHandler: [server.authenticate as any] }, async (request, reply) => {
  const { organizationId, role } = (request as any).user;
  if (!organizationId) return reply.code(404).send({ error: 'No organization linked' });
  if (role !== 'ORG_ADMIN' && role !== 'RECRUITER') { // Allow recruiters to edit career site too
    return reply.code(403).send({ error: 'Not authorized to update org settings' });
  }

  const { settings } = request.body as any;
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { settings },
  });

  return { success: true, settings: org.settings };
});

server.get('/api/jobs/:jobId/triggers', { preHandler: [server.authenticate as any] }, async (request) => {
  const { jobId } = request.params as any;
  return prisma.workflowTrigger.findMany({
    where: { jobId },
    orderBy: { createdAt: 'desc' }
  });
});

server.post('/api/jobs/:jobId/triggers', { preHandler: [server.authenticate as any] }, async (request) => {
  const { jobId } = request.params as any;
  const { stageId, stageName, event, actionType, metadata } = request.body as any;
  
  return prisma.workflowTrigger.create({
    data: {
      jobId, stageId, stageName, event, actionType, metadata
    }
  });
});

server.delete('/api/triggers/:triggerId', { preHandler: [server.authenticate as any] }, async (request) => {
  const { triggerId } = request.params as any;
  await prisma.workflowTrigger.delete({ where: { id: triggerId } });
  return { success: true };
});

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 HireFlow Core API listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
