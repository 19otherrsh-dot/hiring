import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, GripVertical, Calendar } from 'lucide-react';

const COLUMNS = [
  { key: 'APPLIED', label: 'Applied', color: '#6366f1', icon: '📥' },
  { key: 'REVIEWING', label: 'Reviewing', color: '#f59e0b', icon: '👀' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#06b6d4', icon: '⭐' },
  { key: 'INTERVIEW', label: 'Interview', color: '#14b8a6', icon: '🎯' },
  { key: 'HIRED', label: 'Hired', color: '#10b981', icon: '🎉' },
  { key: 'REJECTED', label: 'Rejected', color: '#ef4444', icon: '✕' },
];

export default function KanbanPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: '',
    durationMinutes: 30,
    type: 'VIDEO',
    meetingLink: '',
    notes: '',
  });

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

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggingId(appId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;

    const current = candidates.find(c => c.id === appId);
    if (!current || current.status === newStatus) {
      setDraggingId(null);
      return;
    }

    // Optimistic update
    setCandidates(prev => prev.map(c => c.id === appId ? { ...c, status: newStatus } : c));
    setDraggingId(null);

    try {
      await api.updateApplicationStatus(appId, newStatus);
    } catch (err: any) {
      // Revert on failure
      setCandidates(prev => prev.map(c => c.id === appId ? { ...c, status: current.status } : c));
      alert(err.message);
    }
  };

  const handleScheduleInterview = async () => {
    if (!scheduleModal || !scheduleForm.scheduledAt) return;
    try {
      await api.createInterview({
        applicationId: scheduleModal.id,
        scheduledAt: scheduleForm.scheduledAt,
        durationMinutes: scheduleForm.durationMinutes,
        type: scheduleForm.type,
        meetingLink: scheduleForm.meetingLink || undefined,
        notes: scheduleForm.notes || undefined,
      });
      setCandidates(prev => prev.map(c => c.id === scheduleModal.id ? { ...c, status: 'INTERVIEW' } : c));
      setScheduleModal(null);
      setScheduleForm({ scheduledAt: '', durationMinutes: 30, type: 'VIDEO', meetingLink: '', notes: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = candidates.filter(c => c.status === col.key);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="fade-in">
        <div className="empty-state pulse" style={{ height: '60vh' }}>Loading pipeline…</div>
      </div>
    );
  }

  return (
    <div className="fade-in kanban-page">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline{job ? `: ${job.title}` : ''}</h1>
          <p className="page-subtitle">{candidates.length} candidates</p>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => (
          <div
            key={col.key}
            className={`kanban-column ${dragOverCol === col.key ? 'kanban-column-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="kanban-column-header">
              <span className="kanban-column-dot" style={{ background: col.color }} />
              <span className="kanban-column-title">{col.icon} {col.label}</span>
              <span className="kanban-column-count">{grouped[col.key].length}</span>
            </div>

            <div className="kanban-column-cards">
              {grouped[col.key].map((app: any) => {
                const isBlind = job?.blindScreening;
                const displayName = isBlind ? `Candidate #${app.id.substring(0,6)}` : (app.applicant?.name || 'Anonymous');
                const displayEmail = isBlind ? 'Hidden (Blind Screening)' : app.applicant?.email;

                return (
                <div
                  key={app.id}
                  className={`kanban-card ${draggingId === app.id ? 'kanban-card-dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <div className="kanban-card-grip"><GripVertical size={14} /></div>
                  <div className="kanban-card-body">
                    <div className="kanban-card-name">
                      {displayName}
                    </div>
                    <div className="kanban-card-email">{displayEmail}</div>
                    {app.applicant?.profile && (
                      <div className="kanban-card-skills">
                        {(app.applicant.profile.skills || []).slice(0, 3).map((s: string) => (
                          <span key={s} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="kanban-card-right">
                    {app.matchScore != null && (
                      <div className={`kanban-match ${app.matchScore >= 0.6 ? 'match-high-text' : app.matchScore >= 0.3 ? 'match-medium-text' : 'match-low-text'}`}>
                        {Math.round(app.matchScore * 100)}%
                      </div>
                    )}
                    {(app.status === 'SHORTLISTED' || app.status === 'REVIEWING') && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        onClick={(e) => { e.stopPropagation(); setScheduleModal(app); }}
                      >
                        <Calendar size={12} /> Schedule
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
              {grouped[col.key].length === 0 && (
                <div className="kanban-empty">
                  Drop candidates here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <div className="modal-overlay" onClick={() => setScheduleModal(null)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Interview</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setScheduleModal(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Scheduling for <strong>{scheduleModal.applicant?.name || scheduleModal.applicant?.email}</strong>
            </p>
            <div className="auth-form">
              <div className="input-group">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={scheduleForm.scheduledAt}
                  onChange={e => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={scheduleForm.durationMinutes}
                    onChange={e => setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="input-group">
                  <label>Type</label>
                  <select
                    className="input"
                    value={scheduleForm.type}
                    onChange={e => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="ONSITE">On-site</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Meeting Link</label>
                <input
                  className="input"
                  placeholder="https://meet.google.com/..."
                  value={scheduleForm.meetingLink}
                  onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Notes</label>
                <textarea
                  className="input"
                  placeholder="Any notes for the candidate…"
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  style={{ minHeight: 80 }}
                />
              </div>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleScheduleInterview}
                disabled={!scheduleForm.scheduledAt}
              >
                🎯 Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
