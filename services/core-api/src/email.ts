import * as nodemailer from 'nodemailer';

// Dev SMTP — uses Ethereal (free fake SMTP for development)
// In production, swap with real SMTP credentials (Gmail, SendGrid, Mailgun, etc.)
let transporter: nodemailer.Transporter;

async function getTransporter() {
  if (transporter) return transporter;

  // Check for real SMTP config
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Dev fallback — Ethereal test account (mails are captured, not actually sent)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`📧 Dev email account: ${testAccount.user} — View sent mail at https://ethereal.email`);
  }

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || '"HireFlow AI" <noreply@hireflow.ai>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // In dev, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Preview email: ${previewUrl}`);
    }

    return info;
  } catch (err) {
    console.error('Email send failed:', err);
    return null;
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function applicationConfirmationEmail(candidateName: string, jobTitle: string, companyName: string) {
  return {
    subject: `Application Received — ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">Application Received! 🎉</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${candidateName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;">Your application for <strong style="color: #818cf8;">${jobTitle}</strong> at <strong style="color: #f1f5f9;">${companyName}</strong> has been submitted successfully.</p>
        <p style="color: #94a3b8; line-height: 1.8;">Our AI has analyzed your profile and the recruiter will review your application shortly. You'll be notified as your application status changes.</p>
        <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="color: #818cf8; font-weight: 600; margin: 0;">💡 Tip: Keep your profile and skills up to date to improve your AI match score!</p>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

export function interviewScheduledEmail(candidateName: string, jobTitle: string, date: string, time: string, meetingLink?: string) {
  return {
    subject: `Interview Scheduled — ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">Interview Scheduled! 🎯</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${candidateName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;">You have an interview for <strong style="color: #818cf8;">${jobTitle}</strong>.</p>
        <div style="background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #f1f5f9; margin: 0 0 8px;"><strong>📅 Date:</strong> ${date}</p>
          <p style="color: #f1f5f9; margin: 0 0 8px;"><strong>🕐 Time:</strong> ${time}</p>
          ${meetingLink ? `<p style="color: #f1f5f9; margin: 0;"><strong>🔗 Link:</strong> <a href="${meetingLink}" style="color: #06b6d4;">${meetingLink}</a></p>` : ''}
        </div>
        <p style="color: #94a3b8; line-height: 1.8;">Please be on time. Good luck!</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

export function statusChangeEmail(candidateName: string, jobTitle: string, status: string) {
  const statusMessages: Record<string, string> = {
    REVIEWING: 'Your application is now being reviewed by the hiring team.',
    SHORTLISTED: 'Congratulations! You have been shortlisted! 🎉',
    INTERVIEW: 'You are moving to the interview stage!',
    REJECTED: 'Unfortunately, we have decided to move forward with other candidates at this time.',
    HIRED: 'Congratulations! We are thrilled to offer you the position! 🎉🎉',
  };

  return {
    subject: `Application Update — ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">Application Update</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${candidateName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;">Regarding your application for <strong style="color: #818cf8;">${jobTitle}</strong>:</p>
        <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #818cf8; font-weight: 700; font-size: 16px; margin: 0;">${status}</p>
        </div>
        <p style="color: #94a3b8; line-height: 1.8;">${statusMessages[status] || 'Your application status has been updated.'}</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

export function newApplicationEmail(recruiterName: string, candidateName: string, jobTitle: string, matchScore?: number) {
  return {
    subject: `New Application — ${candidateName} for ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">New Application 📬</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${recruiterName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;"><strong style="color: #f1f5f9;">${candidateName}</strong> just applied to <strong style="color: #818cf8;">${jobTitle}</strong>.</p>
        ${matchScore != null ? `
        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #10b981; font-weight: 700; font-size: 20px; margin: 0;">AI Match: ${Math.round(matchScore * 100)}%</p>
        </div>` : ''}
        <p style="color: #94a3b8; line-height: 1.8;">Review this candidate in your dashboard.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3B: ENTERPRISE EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export function referralInviteEmail(referrerName: string, candidateName: string, jobTitle: string, companyName: string) {
  return {
    subject: `${referrerName} thinks you'd be great for ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">You've Been Referred! 🌟</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${candidateName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;"><strong style="color: #f1f5f9;">${referrerName}</strong> at <strong style="color: #818cf8;">${companyName}</strong> thinks you'd be a great fit for the <strong style="color: #818cf8;">${jobTitle}</strong> position.</p>
        <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #818cf8; font-weight: 600; margin: 0;">Internal referrals receive priority review!</p>
        </div>
        <p style="color: #94a3b8; line-height: 1.8;">Create your profile on HireFlow AI and apply to get started.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

export function referralStatusEmail(referrerName: string, candidateName: string, jobTitle: string, status: string) {
  const statusMessages: Record<string, string> = {
    CONTACTED: 'has been contacted by the recruiter.',
    APPLIED: 'has submitted their application!',
    INTERVIEWING: 'is now in the interview stage! 🎯',
    HIRED: 'has been hired! Thank you for the referral! 🎉🎉',
    REJECTED: 'was not selected for this role at this time.',
  };

  return {
    subject: `Referral Update — ${candidateName} for ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">Referral Update</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${referrerName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;">Your referral <strong style="color: #f1f5f9;">${candidateName}</strong> for <strong style="color: #818cf8;">${jobTitle}</strong> ${statusMessages[status] || 'has a status update.'}</p>
        <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #818cf8; font-weight: 700; font-size: 16px; margin: 0;">${status}</p>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

export function offerLetterEmail(candidateName: string, jobTitle: string, salary: string, startDate: string, expiresDate: string) {
  return {
    subject: `Offer Letter — ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">Congratulations! 🎉🎉</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${candidateName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;">We are thrilled to extend you a formal offer for the position of <strong style="color: #818cf8;">${jobTitle}</strong>.</p>
        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #f1f5f9; margin: 0 0 8px;"><strong>💰 Compensation:</strong> ${salary}</p>
          <p style="color: #f1f5f9; margin: 0 0 8px;"><strong>📅 Start Date:</strong> ${startDate}</p>
          <p style="color: #f1f5f9; margin: 0;"><strong>⏰ Offer Expires:</strong> ${expiresDate}</p>
        </div>
        <p style="color: #94a3b8; line-height: 1.8;">Please log in to HireFlow AI to review the full offer details and respond.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

export function offerResponseEmail(recruiterName: string, candidateName: string, jobTitle: string, accepted: boolean) {
  return {
    subject: `Offer ${accepted ? 'Accepted' : 'Declined'} — ${candidateName} for ${jobTitle}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <h2 style="font-size: 20px; color: #f1f5f9; margin-bottom: 16px;">Offer ${accepted ? 'Accepted! 🎉' : 'Declined'}</h2>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${recruiterName}</strong>,</p>
        <p style="color: #94a3b8; line-height: 1.8;"><strong style="color: #f1f5f9;">${candidateName}</strong> has <strong style="color: ${accepted ? '#10b981' : '#ef4444'};">${accepted ? 'accepted' : 'declined'}</strong> your offer for <strong style="color: #818cf8;">${jobTitle}</strong>.</p>
        <div style="background: ${accepted ? 'rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3)'}; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: ${accepted ? '#10b981' : '#ef4444'}; font-weight: 700; font-size: 20px; margin: 0;">${accepted ? '✅ ACCEPTED' : '❌ DECLINED'}</p>
        </div>
        <p style="color: #94a3b8; line-height: 1.8;">${accepted ? 'Time to start the onboarding process!' : 'You may want to reach out to discuss further.'}</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
      </div>
    `,
  };
}

export function nurtureEmail(candidateName: string, subject: string, body: string) {
  return {
    subject,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <h1 style="font-size: 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">HireFlow AI</h1>
        <p style="color: #94a3b8; line-height: 1.8;">Hi <strong style="color: #f1f5f9;">${candidateName}</strong>,</p>
        <div style="color: #94a3b8; line-height: 1.8; margin: 16px 0;">${body}</div>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">— The HireFlow AI Team</p>
        <p style="color: #475569; font-size: 11px; margin-top: 16px;">You received this because you're in our talent network. <a href="#" style="color: #6366f1;">Unsubscribe</a></p>
      </div>
    `,
  };
}
