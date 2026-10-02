import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Briefcase, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CandidatePortalPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.getMyApplications(),
      api.getMyInterviews().catch(() => []) // Optional, might fail if endpoint not ready
    ]).then(([apps, ints]) => {
      setApplications(apps);
      setInterviews(ints);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPLIED': return <Clock size={18} color="#6366f1" />;
      case 'REVIEWING': return <Clock size={18} color="#f59e0b" />;
      case 'SHORTLISTED': return <CheckCircle size={18} color="#06b6d4" />;
      case 'INTERVIEW': return <Calendar size={18} color="#14b8a6" />;
      case 'HIRED': return <CheckCircle size={18} color="#10b981" />;
      case 'REJECTED': return <XCircle size={18} color="#ef4444" />;
      default: return <Clock size={18} />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return `badge status-${status?.toLowerCase() || 'applied'}`;
  };

  if (loading) {
    return <div className="fade-in empty-state pulse" style={{ height: '50vh' }}>Loading your workspace...</div>;
  }

  return (
    <div className="fade-in container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">Track your job applications and upcoming interviews.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/careers')}>
          <Briefcase size={16} /> Browse More Jobs
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 16, fontWeight: 600 }}>Active Applications</h2>
          {applications.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📄</div>
              <p>You haven't applied to any jobs yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {applications.map(app => (
                <div key={app.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {app.job?.title || 'Unknown Job'}
                    </h3>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>{app.job?.location || 'Remote'}</span>
                      <span>•</span>
                      <span>Applied on {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getStatusIcon(app.status)}
                    <span className={getStatusBadgeClass(app.status)}>{app.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 16, fontWeight: 600 }}>Upcoming Interviews</h2>
          {interviews.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              No upcoming interviews scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {interviews.map(interview => (
                <div key={interview.id} className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{interview.application?.job?.title || 'Job Interview'}</div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> {new Date(interview.scheduledAt).toLocaleString()}</span>
                    {interview.meetingLink && (
                      <a href={interview.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                        Join Meeting →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
