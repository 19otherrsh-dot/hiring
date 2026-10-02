import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Calendar, Video, Phone, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function InterviewsPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyInterviews()
      .then(setInterviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateInterview(id, { status });
      setInterviews(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isRecruiter = user?.role === 'RECRUITER';
  const now = new Date();
  const upcoming = interviews.filter(i => i.status === 'SCHEDULED' && new Date(i.scheduledAt) >= now);
  const past = interviews.filter(i => i.status !== 'SCHEDULED' || new Date(i.scheduledAt) < now);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video size={16} />;
      case 'PHONE': return <Phone size={16} />;
      case 'ONSITE': return <MapPin size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  const statusColors: Record<string, string> = {
    SCHEDULED: '#6366f1',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
    NO_SHOW: '#f59e0b',
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Interviews</h1></div></div>
        <div className="empty-state pulse">Loading interviews…</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Calendar size={28} style={{ display: 'inline', marginRight: 12, verticalAlign: 'middle' }} />
            Interviews
          </h1>
          <p className="page-subtitle">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
      </div>

      {/* Upcoming Interviews */}
      <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        Upcoming
      </h3>

      {upcoming.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">📅</div>
          <p>No upcoming interviews</p>
        </div>
      ) : (
        <div className="interview-grid">
          {upcoming.map((interview: any) => {
            const date = new Date(interview.scheduledAt);
            return (
              <div key={interview.id} className="interview-card">
                <div className="interview-card-date">
                  <div className="interview-date-month">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="interview-date-day">{date.getDate()}</div>
                  <div className="interview-date-time">
                    {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="interview-card-info">
                  <div className="interview-card-title">
                    {interview.application?.job?.title || 'Interview'}
                  </div>
                  <div className="interview-card-meta">
                    {isRecruiter ? (
                      <span>with {interview.application?.applicant?.name || interview.application?.applicant?.email}</span>
                    ) : (
                      <span>{interview.application?.job?.location}</span>
                    )}
                  </div>
                  <div className="interview-card-badges">
                    <span className="badge badge-primary" style={{ display: 'inline-flex', gap: 4 }}>
                      {typeIcon(interview.type)} {interview.type}
                    </span>
                    <span className="badge badge-secondary">
                      <Clock size={12} /> {interview.durationMinutes}min
                    </span>
                  </div>
                  {interview.meetingLink && (
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 8, fontSize: '0.78rem' }}
                    >
                      <Video size={14} /> Join Meeting
                    </a>
                  )}
                  {interview.notes && (
                    <div className="interview-notes">{interview.notes}</div>
                  )}
                </div>
                {isRecruiter && (
                  <div className="interview-card-actions">
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none' }}
                      onClick={() => updateStatus(interview.id, 'COMPLETED')}
                    >
                      <CheckCircle size={14} /> Complete
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none' }}
                      onClick={() => updateStatus(interview.id, 'CANCELLED')}
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Past Interviews */}
      {past.length > 0 && (
        <>
          <h3 style={{ marginTop: 40, marginBottom: 16, color: 'var(--text-secondary)' }}>
            Past Interviews
          </h3>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>{isRecruiter ? 'Candidate' : 'Company'}</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((interview: any) => (
                  <tr key={interview.id}>
                    <td style={{ fontWeight: 600 }}>{interview.application?.job?.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {isRecruiter
                        ? interview.application?.applicant?.name || interview.application?.applicant?.email
                        : interview.application?.job?.recruiter?.name || '—'
                      }
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(interview.scheduledAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ display: 'inline-flex', gap: 4 }}>
                        {typeIcon(interview.type)} {interview.type}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${statusColors[interview.status]}20`,
                          color: statusColors[interview.status],
                        }}
                      >
                        {interview.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
