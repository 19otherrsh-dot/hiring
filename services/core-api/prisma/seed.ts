import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HireFlow AI database...\n');

  // ─── Clean existing data ────────────────────────────────────────────────────
  await prisma.nurtureEnrollment.deleteMany();
  await prisma.nurtureStep.deleteMany();
  await prisma.nurtureSequence.deleteMany();
  await prisma.demographicData.deleteMany();
  await prisma.offerLetter.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.scorecard.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.workflowTrigger.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.application.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();
  console.log('  ✓ Cleaned existing data');

  // ─── Organizations & Departments ──────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      domain: 'acmecorp.com',
      website: 'https://acmecorp.com',
      description: 'Leading tech company building the future of work',
    },
  });

  const engDept = await prisma.department.create({
    data: { name: 'Engineering', organizationId: org.id },
  });
  const designDept = await prisma.department.create({
    data: { name: 'Design', organizationId: org.id },
  });

  console.log('  ✓ Created organization and departments');

  // ─── Users ──────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);

  const recruiter = await prisma.user.create({
    data: {
      email: 'sarah@acmecorp.com',
      passwordHash: hash,
      name: 'Sarah Chen',
      role: 'ORG_ADMIN',
      organizationId: org.id,
    },
  });

  const recruiter2 = await prisma.user.create({
    data: {
      email: 'james@acmecorp.com',
      passwordHash: hash,
      name: 'James Rodriguez',
      role: 'RECRUITER',
      organizationId: org.id,
      departmentId: engDept.id,
    },
  });
  
  const hiringManager = await prisma.user.create({
    data: {
      email: 'mike@acmecorp.com',
      passwordHash: hash,
      name: 'Mike Torres',
      role: 'HIRING_MANAGER',
      organizationId: org.id,
      departmentId: engDept.id,
    },
  });

  const candidates = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alex.johnson@gmail.com', passwordHash: hash, name: 'Alex Johnson', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
            experienceYears: 5, location: 'San Francisco, CA',
            headline: 'Senior Full-Stack Engineer',
            resumeText: 'Experienced full-stack developer with 5 years of expertise in React, TypeScript, and Node.js. Built scalable microservices at Stripe and contributed to open-source projects.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'priya.patel@outlook.com', passwordHash: hash, name: 'Priya Patel', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker'],
            experienceYears: 4, location: 'New York, NY',
            headline: 'ML Engineer',
            resumeText: 'Machine learning engineer with expertise in NLP and computer vision. Published 3 research papers and deployed production ML pipelines at scale.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'marcus.lee@yahoo.com', passwordHash: hash, name: 'Marcus Lee', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['Java', 'Spring Boot', 'Kubernetes', 'PostgreSQL', 'Redis'],
            experienceYears: 7, location: 'Austin, TX',
            headline: 'Staff Backend Engineer',
            resumeText: 'Staff engineer specializing in distributed systems and high-throughput APIs. Led backend architecture at two unicorn startups.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma.wilson@gmail.com', passwordHash: hash, name: 'Emma Wilson', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['Figma', 'React', 'CSS', 'Design Systems', 'Accessibility'],
            experienceYears: 3, location: 'Remote',
            headline: 'Product Designer & Frontend Dev',
            resumeText: 'Hybrid designer-developer creating accessible, beautiful interfaces. Designed and coded the design system at Notion.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.kim@proton.me', passwordHash: hash, name: 'David Kim', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['Go', 'Rust', 'Kubernetes', 'gRPC', 'Terraform'],
            experienceYears: 6, location: 'Seattle, WA',
            headline: 'Infrastructure Engineer',
            resumeText: 'Infrastructure engineer focused on platform reliability. Built the deployment platform serving 100M+ requests/day at Cloudflare.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia.garcia@gmail.com', passwordHash: hash, name: 'Sofia Garcia', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['React', 'Vue.js', 'TypeScript', 'Node.js', 'MongoDB'],
            experienceYears: 3, location: 'Chicago, IL',
            headline: 'Frontend Engineer',
            resumeText: 'Frontend engineer passionate about performance and user experience. Built real-time collaboration features at Figma.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'raj.sharma@gmail.com', passwordHash: hash, name: 'Raj Sharma', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
            experienceYears: 4, location: 'Denver, CO',
            headline: 'Full-Stack Python Developer',
            resumeText: 'Full-stack developer with deep Python expertise. Built fintech platforms handling $2B+ in yearly transactions.',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'lisa.chen@outlook.com', passwordHash: hash, name: 'Lisa Chen', role: 'JOB_SEEKER',
        profile: {
          create: {
            skills: ['Product Management', 'SQL', 'Figma', 'Analytics', 'A/B Testing'],
            experienceYears: 5, location: 'San Francisco, CA',
            headline: 'Senior Product Manager',
            resumeText: 'Product manager who ships. Led the 0-to-1 launch of 3 products at scale. Strong technical background with data-driven decision making.',
          },
        },
      },
    }),
  ]);
  console.log(`  ✓ Created ${candidates.length + 2} users (2 recruiters + ${candidates.length} candidates)`);

  // ─── Jobs ───────────────────────────────────────────────────────────────────
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Full-Stack Engineer',
        description: 'Join our platform team to build next-gen hiring tools. You\'ll work across React, Node.js, and PostgreSQL to ship features that impact millions of users. Strong focus on performance, accessibility, and developer experience.',
        skillsRequired: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
        location: 'San Francisco, CA (Hybrid)',
        salaryRange: '$160,000 – $200,000',
        seniority: 'SENIOR',
        industry: 'Technology',
        organizationId: org.id,
        departmentId: engDept.id,
        recruiterId: recruiter.id,
        blindScreening: false,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Machine Learning Engineer',
        description: 'Build intelligent matching algorithms that connect talent with opportunity. You\'ll design and deploy ML models for resume parsing, skill extraction, and candidate-job matching at scale.',
        skillsRequired: ['Python', 'TensorFlow', 'Machine Learning', 'SQL', 'Docker'],
        location: 'New York, NY (Remote OK)',
        salaryRange: '$170,000 – $220,000',
        seniority: 'SENIOR',
        industry: 'Artificial Intelligence',
        organizationId: org.id,
        departmentId: engDept.id,
        recruiterId: recruiter.id,
        blindScreening: true,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Backend Engineer (Platform)',
        description: 'Own the core API layer powering HireFlow. Design high-throughput, fault-tolerant services in Java/Go. Deep work on database performance, caching strategies, and event-driven architecture.',
        skillsRequired: ['Java', 'Go', 'Kubernetes', 'PostgreSQL', 'Redis'],
        location: 'Austin, TX',
        salaryRange: '$150,000 – $190,000',
        seniority: 'MID',
        industry: 'Technology',
        organizationId: org.id,
        departmentId: engDept.id,
        recruiterId: recruiter.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Product Designer',
        description: 'Shape the future of how companies hire. You\'ll own the end-to-end design process from research to high-fidelity prototypes. Must be comfortable coding in React and building design systems.',
        skillsRequired: ['Figma', 'React', 'CSS', 'Design Systems', 'Accessibility'],
        location: 'Remote (US)',
        salaryRange: '$130,000 – $170,000',
        seniority: 'MID',
        industry: 'Design',
        organizationId: org.id,
        departmentId: designDept.id,
        recruiterId: recruiter.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Infrastructure Engineer',
        description: 'Build the platform that runs HireFlow. Own Kubernetes clusters, CI/CD pipelines, observability, and incident response. We value reliability engineering and automation.',
        skillsRequired: ['Kubernetes', 'Terraform', 'Go', 'AWS', 'Linux'],
        location: 'Seattle, WA (Hybrid)',
        salaryRange: '$160,000 – $210,000',
        seniority: 'SENIOR',
        industry: 'Infrastructure',
        organizationId: org.id,
        departmentId: engDept.id,
        recruiterId: recruiter.id,
      },
    }),
  ]);
  console.log(`  ✓ Created ${jobs.length} jobs`);

  // ─── Pipeline Stages ────────────────────────────────────────────────────────
  for (const job of jobs) {
    const stages = await Promise.all([
      prisma.pipelineStage.create({ data: { jobId: job.id, name: 'Applied', color: '#6366f1', order: 0 } }),
      prisma.pipelineStage.create({ data: { jobId: job.id, name: 'Phone Screen', color: '#8b5cf6', order: 1 } }),
      prisma.pipelineStage.create({ data: { jobId: job.id, name: 'Technical', color: '#06b6d4', order: 2 } }),
      prisma.pipelineStage.create({ data: { jobId: job.id, name: 'Final Round', color: '#14b8a6', order: 3 } }),
      prisma.pipelineStage.create({ data: { jobId: job.id, name: 'Offer', color: '#10b981', order: 4 } }),
    ]);

    // Create a workflow trigger for Technical stage
    const technicalStage = stages.find(s => s.name === 'Technical');
    if (technicalStage) {
      await prisma.workflowTrigger.create({
        data: {
          jobId: job.id,
          stageId: technicalStage.id,
          stageName: 'Technical',
          event: 'STAGE_ENTERED',
          actionType: 'SEND_SLACK_NOTIF',
          metadata: { channel: '#hiring-eng' },
        }
      });
    }
  }
  console.log('  ✓ Created pipeline stages and sample workflow triggers for all jobs');

  // ─── Applications (with realistic statuses & match scores) ──────────────────
  const applicationData = [
    // Job 0 (Full-Stack): 4 applicants
    { jobIdx: 0, candIdx: 0, status: 'SHORTLISTED', matchScore: 0.92 },
    { jobIdx: 0, candIdx: 5, status: 'INTERVIEW', matchScore: 0.78 },
    { jobIdx: 0, candIdx: 6, status: 'REVIEWING', matchScore: 0.65 },
    { jobIdx: 0, candIdx: 3, status: 'APPLIED', matchScore: 0.45 },
    // Job 1 (ML): 3 applicants
    { jobIdx: 1, candIdx: 1, status: 'HIRED', matchScore: 0.95 },
    { jobIdx: 1, candIdx: 6, status: 'REJECTED', matchScore: 0.35 },
    { jobIdx: 1, candIdx: 0, status: 'REVIEWING', matchScore: 0.42 },
    // Job 2 (Backend): 3 applicants
    { jobIdx: 2, candIdx: 2, status: 'INTERVIEW', matchScore: 0.88 },
    { jobIdx: 2, candIdx: 4, status: 'SHORTLISTED', matchScore: 0.72 },
    { jobIdx: 2, candIdx: 6, status: 'APPLIED', matchScore: 0.55 },
    // Job 3 (Designer): 2 applicants
    { jobIdx: 3, candIdx: 3, status: 'SHORTLISTED', matchScore: 0.91 },
    { jobIdx: 3, candIdx: 5, status: 'REVIEWING', matchScore: 0.48 },
    // Job 4 (Infra): 3 applicants
    { jobIdx: 4, candIdx: 4, status: 'INTERVIEW', matchScore: 0.94 },
    { jobIdx: 4, candIdx: 2, status: 'SHORTLISTED', matchScore: 0.68 },
    { jobIdx: 4, candIdx: 0, status: 'APPLIED', matchScore: 0.38 },
  ];

  const applications: any[] = [];
  for (const ad of applicationData) {
    const app = await prisma.application.create({
      data: {
        jobId: jobs[ad.jobIdx].id,
        applicantId: candidates[ad.candIdx].id,
        status: ad.status as any,
        matchScore: ad.matchScore,
        coverNote: 'I\'m excited about this opportunity and believe my experience aligns well with the role.',
      },
    });
    applications.push({ ...app, jobIdx: ad.jobIdx, candIdx: ad.candIdx });
  }
  console.log(`  ✓ Created ${applications.length} applications`);

  // ─── Interviews ─────────────────────────────────────────────────────────────
  const interviewApps = applications.filter(a => ['INTERVIEW', 'HIRED'].includes(a.status));
  const interviews: any[] = [];
  for (const app of interviewApps) {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + Math.floor(Math.random() * 14) + 1);

    const interview = await prisma.interview.create({
      data: {
        applicationId: app.id,
        scheduledAt,
        durationMinutes: [30, 45, 60][Math.floor(Math.random() * 3)],
        type: ['VIDEO', 'PHONE', 'ONSITE'][Math.floor(Math.random() * 3)] as any,
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        status: app.status === 'HIRED' ? 'COMPLETED' : 'SCHEDULED',
      },
    });
    interviews.push(interview);
  }
  console.log(`  ✓ Created ${interviews.length} interviews`);

  // ─── Scorecards (for completed interviews) ──────────────────────────────────
  const completedInterviews = interviews.filter((_, i) => interviewApps[i].status === 'HIRED');
  for (const interview of completedInterviews) {
    await prisma.scorecard.create({
      data: {
        interviewId: interview.id,
        evaluatorId: recruiter.id,
        technicalScore: 5,
        communicationScore: 4,
        problemSolvingScore: 5,
        cultureFitScore: 4,
        overallScore: 5,
        strengths: 'Exceptional technical depth, strong communication skills',
        weaknesses: 'Could improve on system design documentation',
        recommendation: 'STRONG_YES',
        notes: 'One of the strongest candidates we\'ve interviewed. Immediate hire recommendation.',
      },
    });
  }
  console.log(`  ✓ Created ${completedInterviews.length} scorecards`);

  // ─── Referrals ──────────────────────────────────────────────────────────────
  const referrals = await Promise.all([
    prisma.referral.create({
      data: {
        referrerId: recruiter2.id,
        jobId: jobs[0].id,
        candidateName: 'Olivia Brown',
        candidateEmail: 'olivia.brown@gmail.com',
        notes: 'Former colleague at Google — incredible engineer.',
        status: 'APPLIED',
      },
    }),
    prisma.referral.create({
      data: {
        referrerId: recruiter.id,
        jobId: jobs[1].id,
        candidateName: 'Noah Martinez',
        candidateEmail: 'noah.m@stanford.edu',
        notes: 'Stanford PhD graduate — perfect for our ML team.',
        status: 'INTERVIEWING',
      },
    }),
    prisma.referral.create({
      data: {
        referrerId: recruiter2.id,
        jobId: jobs[2].id,
        candidateName: 'Ava Thompson',
        candidateEmail: 'ava.t@outlook.com',
        notes: 'Met at KubeCon — very strong distributed systems background.',
        status: 'CONTACTED',
      },
    }),
    prisma.referral.create({
      data: {
        referrerId: recruiter.id,
        jobId: jobs[0].id,
        candidateName: 'Liam Davis',
        candidateEmail: 'liam.davis@proton.me',
        notes: 'He built the entire commerce platform at Shopify.',
        status: 'HIRED',
        bonus: 5000,
      },
    }),
    prisma.referral.create({
      data: {
        referrerId: recruiter2.id,
        jobId: jobs[3].id,
        candidateName: 'Isabella Wang',
        candidateEmail: 'bella.wang@gmail.com',
        notes: 'Amazing portfolio — previously at Airbnb design team.',
        status: 'PENDING',
      },
    }),
  ]);
  console.log(`  ✓ Created ${referrals.length} referrals`);

  // ─── Offer Letters ──────────────────────────────────────────────────────────
  // Priya got hired for ML role
  const hiredApp = applications.find(a => a.status === 'HIRED');
  const offers = [];
  if (hiredApp) {
    const offer1 = await prisma.offerLetter.create({
      data: {
        applicationId: hiredApp.id,
        salary: 185000,
        currency: 'USD',
        startDate: new Date('2026-06-01'),
        expiresAt: new Date('2026-05-01'),
        benefits: 'Health/dental/vision insurance, 401k with 4% match, unlimited PTO, $5k learning budget, equity (0.05%)',
        jobTitle: 'Machine Learning Engineer',
        status: 'ACCEPTED',
        approvedById: recruiter.id,
      },
    });
    offers.push(offer1);
  }

  // Draft offer for Marcus (Backend)
  const marcusApp = applications.find(a => a.candIdx === 2 && a.jobIdx === 2);
  if (marcusApp) {
    const offer2 = await prisma.offerLetter.create({
      data: {
        applicationId: marcusApp.id,
        salary: 175000,
        currency: 'USD',
        startDate: new Date('2026-07-15'),
        expiresAt: new Date('2026-05-15'),
        benefits: 'Full benefits package, remote-first, $3k home office budget, annual retreat',
        jobTitle: 'Backend Engineer (Platform)',
        status: 'APPROVED',
        approvedById: recruiter.id,
      },
    });
    offers.push(offer2);
  }

  // Sent offer for David (Infra)
  const davidApp = applications.find(a => a.candIdx === 4 && a.jobIdx === 4);
  if (davidApp) {
    const offer3 = await prisma.offerLetter.create({
      data: {
        applicationId: davidApp.id,
        salary: 195000,
        currency: 'USD',
        startDate: new Date('2026-06-15'),
        expiresAt: new Date('2026-05-10'),
        benefits: 'Premium benefits, equity (0.08%), relocation assistance, annual conference budget',
        jobTitle: 'Infrastructure Engineer',
        status: 'SENT',
      },
    });
    offers.push(offer3);
  }
  console.log(`  ✓ Created ${offers.length} offer letters`);

  // ─── Demographic Data (voluntary) ──────────────────────────────────────────
  const demoApps = applications.slice(0, 8);
  const genders = ['Male', 'Female', 'Female', 'Non-binary', 'Male', 'Female', 'Male', 'Female'];
  const ethnicities = ['Asian', 'Asian', 'White', 'Hispanic or Latino', 'Black or African American', 'White', 'Asian', 'Hispanic or Latino'];

  for (let i = 0; i < demoApps.length; i++) {
    await prisma.demographicData.create({
      data: {
        applicationId: demoApps[i].id,
        gender: genders[i],
        ethnicity: ethnicities[i],
        veteranStatus: i % 5 === 0 ? 'Veteran' : 'Non-veteran',
        disabilityStatus: i % 7 === 0 ? 'Yes' : 'No',
      },
    });
  }
  console.log(`  ✓ Created ${demoApps.length} demographic records`);

  // ─── Nurture Sequences ──────────────────────────────────────────────────────
  const seq1 = await prisma.nurtureSequence.create({
    data: {
      name: 'Welcome to Our Talent Network',
      description: 'A 3-step warmup sequence for cold candidates who visited our careers page',
      recruiterId: recruiter.id,
      isActive: true,
      steps: {
        create: [
          { order: 0, subject: 'Welcome to our talent community! 👋', body: '<p>Thanks for your interest in Acme Corp. We\'re always looking for great talent and wanted to keep in touch.</p><p>We\'ll send you relevant updates about exciting roles that match your background.</p>', delayDays: 0 },
          { order: 1, subject: 'What it\'s like to work at Acme', body: '<p>Here\'s a behind-the-scenes look at our engineering culture, tech stack, and the problems we\'re solving.</p><p><strong>Our stack:</strong> React, Node.js, PostgreSQL, Kubernetes</p><p><strong>Our values:</strong> Ship fast, iterate often, always be learning.</p>', delayDays: 3 },
          { order: 2, subject: 'We have roles you might love', body: '<p>Based on your profile, here are some open positions:</p><ul><li>Senior Full-Stack Engineer — SF (Hybrid)</li><li>ML Engineer — NYC (Remote OK)</li><li>Infrastructure Engineer — Seattle</li></ul><p>Interested? Reply to this email or apply directly!</p>', delayDays: 7 },
        ],
      },
    },
  });

  const seq2 = await prisma.nurtureSequence.create({
    data: {
      name: 'Re-engagement: Past Applicants',
      description: 'Reach out to candidates who were strong but didn\'t get selected last time',
      recruiterId: recruiter.id,
      isActive: true,
      steps: {
        create: [
          { order: 0, subject: 'We haven\'t forgotten about you!', body: '<p>Hi there! You applied to Acme Corp a while back. While we went in a different direction at the time, your profile impressed us.</p><p>We have new roles opening up and think you\'d be a great fit.</p>', delayDays: 0 },
          { order: 1, subject: 'New positions at Acme Corp', body: '<p>We\'ve expanded our team and have exciting new openings. Would love to reconnect and discuss how your skills could fit.</p>', delayDays: 5 },
        ],
      },
    },
  });

  // Enroll some passive candidates
  await prisma.nurtureEnrollment.create({
    data: {
      sequenceId: seq1.id,
      candidateEmail: 'passive.talent1@gmail.com',
      candidateName: 'Chris Anderson',
      currentStep: 1,
      status: 'ACTIVE',
      nextSendAt: new Date(Date.now() + 2 * 86400000),
      lastSentAt: new Date(Date.now() - 86400000),
    },
  });
  await prisma.nurtureEnrollment.create({
    data: {
      sequenceId: seq1.id,
      candidateEmail: 'passive.talent2@outlook.com',
      candidateName: 'Mia Taylor',
      currentStep: 0,
      status: 'ACTIVE',
      nextSendAt: new Date(Date.now() + 1 * 86400000),
    },
  });
  await prisma.nurtureEnrollment.create({
    data: {
      sequenceId: seq1.id,
      candidateEmail: 'past.applicant@gmail.com',
      candidateName: 'Ethan Moore',
      currentStep: 3,
      status: 'COMPLETED',
      lastSentAt: new Date(Date.now() - 5 * 86400000),
    },
  });
  await prisma.nurtureEnrollment.create({
    data: {
      sequenceId: seq2.id,
      candidateEmail: 'returning@gmail.com',
      candidateName: 'Zoe Jackson',
      currentStep: 0,
      status: 'ACTIVE',
      nextSendAt: new Date(Date.now() + 3 * 86400000),
    },
  });
  console.log(`  ✓ Created 2 nurture sequences with 4 enrollments`);

  // ─── Activity Log Entries ───────────────────────────────────────────────────
  for (const app of applications.slice(0, 6)) {
    await prisma.activity.create({
      data: {
        applicationId: app.id,
        actorId: recruiter.id,
        type: 'STATUS_CHANGE',
        title: `Status changed to ${app.status}`,
        description: `Application moved to ${app.status} stage`,
      },
    });
  }
  console.log('  ✓ Created activity log entries');

  // ─── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: recruiter.id, type: 'NEW_APPLICATION', title: 'New Application', message: 'Alex Johnson applied to Senior Full-Stack Engineer', linkUrl: `/candidates/${jobs[0].id}` },
      { userId: recruiter.id, type: 'NEW_REFERRAL', title: 'New Referral', message: 'James referred Olivia Brown for Full-Stack Engineer', linkUrl: '/referrals' },
      { userId: recruiter.id, type: 'OFFER_RESPONSE', title: 'Offer Accepted! 🎉', message: 'Priya Patel accepted the ML Engineer offer', linkUrl: '/offers' },
      { userId: candidates[0].id, type: 'STATUS_CHANGE', title: 'Application Update', message: 'Your application for Senior Full-Stack Engineer has been shortlisted!', linkUrl: '/jobs' },
      { userId: candidates[1].id, type: 'OFFER_RECEIVED', title: 'You Received an Offer! 🎉', message: 'Congratulations! You have a formal offer for ML Engineer', linkUrl: '/offers' },
    ],
  });
  console.log('  ✓ Created notifications');

  console.log('\n🎉 Seed complete! Here\'s what was created:');
  console.log(`   • ${2} recruiters + ${candidates.length} candidates`);
  console.log(`   • ${jobs.length} jobs with pipeline stages`);
  console.log(`   • ${applications.length} applications`);
  console.log(`   • ${interviews.length} interviews + scorecards`);
  console.log(`   • ${referrals.length} referrals`);
  console.log(`   • ${offers.length} offer letters`);
  console.log(`   • ${demoApps.length} demographic records`);
  console.log(`   • 2 nurture sequences + 4 enrollments`);
  console.log(`\n   Login credentials:`);
  console.log(`   Recruiter: sarah@acmecorp.com / password123`);
  console.log(`   Candidate: priya.patel@outlook.com / password123`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
