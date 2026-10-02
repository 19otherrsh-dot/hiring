import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft } from 'lucide-react';

export default function CandidatesPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      api.getJobCandidates(jobId),
      api.getJob(jobId),
    ]).then(([cands, j]) => {
      setCandidates(cands);
      setJob(j);
    }).finally(() => setLoading(false));
  }, [jobId]);

  const updateStatus = async (appId: string, status: string) => {
    try {
      await api.updateApplicationStatus(appId, status);
      setCandidates(prev =>
        prev.map(c => c.id === appId ? { ...c, status } : c)
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getMatchClass = (score: number | null) => {
    if (score == null) return '';
    if (score >= 0.6) return 'match-high';
    if (score >= 0.3) return 'match-medium';
    return 'match-low';
  };

  return (
    <div className="fade-in">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Candidates{job ? ` for "${job.title}"` : ''}</h1>
          <p className="page-subtitle">{candidates.length} applicant{candidates.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state pulse">Loading candidates…</div>
      ) : candidates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p>No candidates have applied yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {candidates.map((app: any) => {
            const isBlind = job?.blindScreening;
            const displayName = isBlind ? `Candidate #${app.id.substring(0,6)}` : (app.applicant?.name || 'Anonymous');
            const displayEmail = isBlind ? 'Hidden (Blind Screening)' : app.applicant?.email;
            const avatarChar = isBlind ? '?' : (app.applicant?.name || app.applicant?.email || '?')[0].toUpperCase();

            return (
            <div key={app.id} className="pipeline-row">
              <div className="pipeline-avatar">
                {avatarChar}
              </div>
              <div className="pipeline-info">
                <div className="pipeline-name">{displayName}</div>
                <div className="pipeline-email">{displayEmail}</div>
                {app.applicant?.profile && (
                  <div style={{ marginTop: 4 }}>
                    <div className="job-skills">
                      {(app.applicant.profile.skills || []).slice(0, 4).map((s: string) => (
                        <span key={s} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{s}</span>
                      ))}
                      {app.applicant.profile.experienceYears > 0 && (
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{app.applicant.profile.experienceYears} yrs</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {app.matchScore != null && (
                <div className={`match-score ${getMatchClass(app.matchScore)}`}>
                  {Math.round(app.matchScore * 100)}%
                </div>
              )}
              <span className={`badge status-${app.status?.toLowerCase()}`}>{app.status}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {app.status !== 'SHORTLISTED' && app.status !== 'HIRED' && app.status !== 'REJECTED' && (
                  <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none' }} onClick={() => updateStatus(app.id, 'SHORTLISTED')}>
                    Shortlist
                  </button>
                )}
                {app.status !== 'REJECTED' && app.status !== 'HIRED' && (
                  <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none' }} onClick={() => updateStatus(app.id, 'REJECTED')}>
                    Reject
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
