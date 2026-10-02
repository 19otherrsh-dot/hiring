import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Briefcase, Users, TrendingUp, Clock, Search, MapPin,
  UserPlus, FileText, Shield, CheckCircle, Award, Mail,
  ArrowRight, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== 'JOB_SEEKER') {
    return <RecruiterDashboard />;
  }
  return <SeekerDashboard />;
}

function SeekerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    api.getMyApplications().then(setApplications).catch(() => {});
    api.getMyOffers().then(setOffers).catch(() => {});
    api.getJobs({ page: 1 }).then(d => setRecentJobs(d.jobs?.slice(0, 6) || [])).catch(() => {});
  }, []);

  const pendingOffers = offers.filter(o => o.status === 'SENT');

  const stats = [
    { icon: <Briefcase size={22} />, label: 'Applications', value: applications.length, color: '#6366f1' },
    { icon: <Clock size={22} />, label: 'In Review', value: applications.filter(a => a.status === 'REVIEWING').length, color: '#f59e0b' },
    { icon: <TrendingUp size={22} />, label: 'Shortlisted', value: applications.filter(a => a.status === 'SHORTLISTED').length, color: '#10b981' },
    { icon: <FileText size={22} />, label: 'Offers', value: pendingOffers.length, color: '#06b6d4' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name || 'there'} 👋</h1>
          <p className="page-subtitle">Here's your job search overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
          <Search size={16} /> Browse Jobs
        </button>
      </div>

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Offers Alert */}
      {pendingOffers.length > 0 && (
        <div
          onClick={() => navigate('/offers')}
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.12))',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: 24,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                🎉 You have {pendingOffers.length} pending offer{pendingOffers.length > 1 ? 's' : ''}!
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Click to review and respond
              </div>
            </div>
          </div>
          <ArrowRight size={20} style={{ color: '#10b981' }} />
        </div>
      )}

      <h3 style={{ marginBottom: 16 }}>Recent Applications</h3>
      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No applications yet. Start browsing jobs!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/jobs')}>
            Find Jobs
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Match</th>
                <th>Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 10).map((app: any) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.job?.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{app.job?.recruiter?.name || '—'}</td>
                  <td>
                    {app.matchScore != null ? (
                      <span className={`match-score ${app.matchScore >= 0.6 ? 'match-high' : app.matchScore >= 0.3 ? 'match-medium' : 'match-low'}`}>
                        {Math.round(app.matchScore * 100)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge status-${app.status?.toLowerCase()}`}>{app.status}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);
  const [deptFilter, setDeptFilter] = useState<string>('all');

  useEffect(() => {
    api.getMyJobs().then(setJobs).catch(() => {});
    api.getReferralStats().then(setReferralStats).catch(() => {});
    api.getMyOffers().then(setOffers).catch(() => {});
    api.getMyOrganization().then(setOrg).catch(() => {});
  }, []);

  // Apply department filter to jobs
  const filteredJobs = deptFilter === 'all'
    ? jobs
    : jobs.filter((j: any) => j.departmentId === deptFilter);

  const totalApps = filteredJobs.reduce((acc: number, j: any) => acc + (j._count?.applications || 0), 0);
  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED').length;
  const pendingOffers = offers.filter(o => ['DRAFT', 'APPROVED', 'SENT'].includes(o.status)).length;
  const totalReferrals = referralStats?.statusBreakdown?.total || 0;
  const hiredReferrals = referralStats?.statusBreakdown?.hired || 0;

  const stats = [
    { icon: <Briefcase size={22} />, label: 'Active Jobs', value: filteredJobs.filter(j => j.isActive).length, color: '#6366f1' },
    { icon: <Users size={22} />, label: 'Total Applicants', value: totalApps, color: '#06b6d4' },
    { icon: <CheckCircle size={22} />, label: 'Offers Accepted', value: acceptedOffers, color: '#10b981' },
    { icon: <UserPlus size={22} />, label: 'Referrals', value: totalReferrals, color: '#f59e0b' },
  ];

  // Quick actions — role-aware
  const isAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'SYSTEM_ADMIN';
  const isHM = user?.role === 'HIRING_MANAGER';
  const quickActions = [
    ...(isAdmin || user?.role === 'RECRUITER' ? [{ icon: <Briefcase size={18} />, label: 'Post a Job', path: '/post-job', color: '#6366f1' }] : []),
    { icon: <UserPlus size={18} />, label: 'Referrals', path: '/referrals', color: '#f59e0b', badge: totalReferrals || null },
    { icon: <FileText size={18} />, label: 'Offers', path: '/offers', color: '#10b981', badge: pendingOffers || null },
    ...(isAdmin || user?.role === 'RECRUITER' ? [
      { icon: <Shield size={18} />, label: 'DEI Dashboard', path: '/compliance', color: '#06b6d4' },
      { icon: <Mail size={18} />, label: 'Nurture', path: '/nurture', color: '#8b5cf6' },
    ] : []),
    { icon: <TrendingUp size={18} />, label: 'Analytics', path: '/analytics', color: '#ec4899' },
  ];

  // Role label for the greeting
  const roleLabels: Record<string, string> = {
    ORG_ADMIN: 'Organization Admin',
    RECRUITER: 'Recruiter',
    HIRING_MANAGER: 'Hiring Manager',
    INTERVIEWER: 'Interviewer',
    COORDINATOR: 'Coordinator',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {org?.name ? `${org.name} ` : ''}Dashboard
          </h1>
          <p className="page-subtitle">
            <span className="badge" style={{ fontSize: '0.7rem', marginRight: 8, verticalAlign: 'middle' }}>
              {roleLabels[user?.role || ''] || user?.role}
            </span>
            {user?.department?.name && (
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>
                {user.department.name}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Department filter */}
          {org?.departments?.length > 1 && (
            <select
              className="input"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              style={{ width: 180, fontSize: '0.85rem' }}
            >
              <option value="all">All Departments</option>
              {org.departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          {(isAdmin || user?.role === 'RECRUITER') && (
            <button className="btn btn-primary" onClick={() => navigate('/post-job')}>
              + Post a Job
            </button>
          )}
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <h3 style={{ marginBottom: 12 }}>Quick Actions</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 10,
        marginBottom: 28,
      }}>
        {quickActions.map((action) => (
          <div
            key={action.path}
            onClick={() => navigate(action.path)}
            style={{
              padding: '16px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s',
              position: 'relative',
            }}
            className="card"
          >
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: `${action.color}12`, color: action.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {action.icon}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{action.label}</span>
            {action.badge && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                background: action.color, color: 'white',
                fontSize: '0.65rem', fontWeight: 700,
                borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {action.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Offer Pipeline Summary */}
      {offers.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Offer Pipeline</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/offers')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4,
          }}>
            {[
              { label: 'Draft', status: 'DRAFT', color: '#64748b' },
              { label: 'Approved', status: 'APPROVED', color: '#06b6d4' },
              { label: 'Sent', status: 'SENT', color: '#6366f1' },
              { label: 'Accepted', status: 'ACCEPTED', color: '#10b981' },
              { label: 'Declined', status: 'DECLINED', color: '#ef4444' },
            ].map(stage => {
              const count = offers.filter(o => o.status === stage.status).length;
              return (
                <div key={stage.status} className="card" style={{
                  flex: '1 0 120px', textAlign: 'center', padding: '14px 10px',
                  borderTop: `3px solid ${stage.color}`,
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stage.color }}>{count}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{stage.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral Leaderboard Mini */}
      {referralStats?.topReferrers?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>🏆 Top Referrers</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/referrals')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {referralStats.topReferrers.slice(0, 3).map((ref: any, i: number) => (
              <div className="card" key={ref.id} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.85rem', color: 'white', flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ref.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ref.count} referrals · {ref.hired} hired
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Postings Table */}
      <h3 style={{ marginBottom: 16 }}>
        {deptFilter === 'all' ? 'All Job Postings' : `${org?.departments?.find((d: any) => d.id === deptFilter)?.name || ''} Jobs`}
        <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 8 }}>({filteredJobs.length})</span>
      </h3>
      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>{deptFilter !== 'all' ? 'No jobs in this department.' : 'No job postings yet. Create your first one!'}</p>
          {deptFilter !== 'all' && (
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => setDeptFilter('all')}>
              Show All Departments
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Location</th>
                <th>Applicants</th>
                <th>Status</th>
                <th>Posted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job: any) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600 }}>{job.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />{job.location}</td>
                  <td><span className="badge badge-primary">{job._count?.applications || 0}</span></td>
                  <td><span className={`badge ${job.isActive ? 'badge-success' : 'badge-secondary'}`}>{job.isActive ? 'Active' : 'Closed'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/pipeline/${job.id}`)}>
                      Pipeline
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/candidates/${job.id}`)}>
                      List View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
