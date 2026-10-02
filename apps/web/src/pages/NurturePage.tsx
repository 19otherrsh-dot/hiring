import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Mail, Plus, Play, Pause, Users, Trash2, ChevronRight, Send, Clock, Zap } from 'lucide-react';

export default function NurturePage() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [stepForm, setStepForm] = useState({ subject: '', body: '', delayDays: '1' });
  const [enrollForm, setEnrollForm] = useState({ candidateEmail: '', candidateName: '' });
  const [showAddStep, setShowAddStep] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);

  useEffect(() => { loadSequences(); }, []);

  async function loadSequences() {
    try {
      const s = await api.getSequences();
      setSequences(s);
    } catch (err) {}
  }

  async function loadSequenceDetail(seqId: string) {
    try {
      const s = await api.getSequence(seqId);
      setSelected(s);
    } catch (err) {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const seq = await api.createSequence(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      loadSequences();
      loadSequenceDetail(seq.id);
    } catch (err: any) { alert(err.message); }
  }

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.addSequenceStep(selected.id, {
        subject: stepForm.subject,
        body: stepForm.body,
        delayDays: parseInt(stepForm.delayDays) || 1,
        order: (selected.steps?.length || 0),
      });
      setStepForm({ subject: '', body: '', delayDays: '1' });
      setShowAddStep(false);
      loadSequenceDetail(selected.id);
      loadSequences();
    } catch (err: any) { alert(err.message); }
  }

  async function handleDeleteStep(stepId: string) {
    if (!confirm('Delete this step?')) return;
    try {
      await api.deleteSequenceStep(stepId);
      loadSequenceDetail(selected.id);
      loadSequences();
    } catch (err: any) { alert(err.message); }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.enrollCandidate(selected.id, enrollForm);
      setEnrollForm({ candidateEmail: '', candidateName: '' });
      setShowEnroll(false);
      loadSequenceDetail(selected.id);
      loadSequences();
    } catch (err: any) { alert(err.message); }
  }

  async function handleToggle(seqId: string) {
    try {
      await api.toggleSequence(seqId);
      loadSequences();
      if (selected?.id === seqId) loadSequenceDetail(seqId);
    } catch (err: any) { alert(err.message); }
  }

  const stats = [
    { icon: <Mail size={22} />, label: 'Sequences', value: sequences.length, color: '#6366f1' },
    { icon: <Play size={22} />, label: 'Active', value: sequences.filter(s => s.isActive).length, color: '#10b981' },
    { icon: <Users size={22} />, label: 'Enrolled', value: sequences.reduce((a: number, s: any) => a + (s._count?.enrollments || 0), 0), color: '#06b6d4' },
    { icon: <Zap size={22} />, label: 'Total Steps', value: sequences.reduce((a: number, s: any) => a + (s.steps?.length || 0), 0), color: '#f59e0b' },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: '#10b981',
    COMPLETED: '#6366f1',
    PAUSED: '#f59e0b',
    UNSUBSCRIBED: '#ef4444',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nurture Campaigns 💌</h1>
          <p className="page-subtitle">Automated email sequences to engage passive talent</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={16} /> New Sequence
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

      {/* Create Sequence Form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Create New Sequence</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label>Sequence Name *</label>
              <input className="input" placeholder="e.g., Welcome Series, Re-engagement Campaign" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea className="input" placeholder="What is this sequence about?" value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} style={{ minHeight: 60 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit"><Plus size={16} /> Create</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: 24 }}>
        {/* Sequences List */}
        <div>
          <h3 style={{ marginBottom: 12 }}>Sequences</h3>
          {sequences.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">📧</div>
              <p>No sequences yet. Create your first campaign!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sequences.map((seq: any) => (
                <div
                  key={seq.id}
                  className="card"
                  onClick={() => loadSequenceDetail(seq.id)}
                  style={{
                    cursor: 'pointer', padding: '16px 20px',
                    borderColor: selected?.id === seq.id ? 'var(--accent-primary)' : undefined,
                    background: selected?.id === seq.id ? 'rgba(99,102,241,0.08)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{seq.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {seq.steps?.length || 0} steps · {seq._count?.enrollments || 0} enrolled
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className={`btn btn-sm ${seq.isActive ? 'btn-outline' : 'btn-secondary'}`}
                        onClick={(e) => { e.stopPropagation(); handleToggle(seq.id); }}
                        style={{ padding: '4px 10px' }}
                        title={seq.isActive ? 'Pause' : 'Activate'}
                      >
                        {seq.isActive ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sequence Detail */}
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3>{selected.name}</h3>
                {selected.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{selected.description}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAddStep(!showAddStep)}>
                  <Plus size={14} /> Add Step
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowEnroll(!showEnroll)}>
                  <Users size={14} /> Enroll
                </button>
              </div>
            </div>

            {/* Add Step Form */}
            {showAddStep && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Add Email Step</h4>
                <form onSubmit={handleAddStep} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                    <div className="input-group">
                      <label>Subject Line *</label>
                      <input className="input" placeholder="Email subject" value={stepForm.subject} onChange={e => setStepForm({ ...stepForm, subject: e.target.value })} required />
                    </div>
                    <div className="input-group">
                      <label>Delay (days)</label>
                      <input className="input" type="number" min="1" value={stepForm.delayDays} onChange={e => setStepForm({ ...stepForm, delayDays: e.target.value })} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Email Body (HTML supported) *</label>
                    <textarea className="input" placeholder="Write your email content..." value={stepForm.body} onChange={e => setStepForm({ ...stepForm, body: e.target.value })} style={{ minHeight: 100 }} required />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" type="submit">Add Step</button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowAddStep(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Enroll Form */}
            {showEnroll && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Enroll Candidate</h4>
                <form onSubmit={handleEnroll} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Email *</label>
                    <input className="input" type="email" placeholder="candidate@example.com" value={enrollForm.candidateEmail} onChange={e => setEnrollForm({ ...enrollForm, candidateEmail: e.target.value })} required />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Name</label>
                    <input className="input" placeholder="Candidate name" value={enrollForm.candidateName} onChange={e => setEnrollForm({ ...enrollForm, candidateName: e.target.value })} />
                  </div>
                  <button className="btn btn-primary btn-sm" type="submit" style={{ marginBottom: 1 }}>Enroll</button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowEnroll(false)} style={{ marginBottom: 1 }}>Cancel</button>
                </form>
              </div>
            )}

            {/* Steps Timeline */}
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Email Steps ({selected.steps?.length || 0})
            </h4>
            {selected.steps?.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                No steps added. Add your first email step above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selected.steps?.map((step: any, i: number) => (
                  <div key={step.id} style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                    {/* Timeline Connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--accent-gradient)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.7rem', color: 'white', flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      {i < (selected.steps?.length || 0) - 1 && (
                        <div style={{ flex: 1, width: 2, background: 'var(--border-color)', margin: '4px 0' }} />
                      )}
                    </div>
                    {/* Step Content */}
                    <div className="card" style={{ flex: 1, marginBottom: 8, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{step.subject}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} /> {step.delayDays} day{step.delayDays !== 1 ? 's' : ''} after previous
                          </div>
                        </div>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleDeleteStep(step.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '4px 8px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{
                        marginTop: 8, padding: 10, borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)', fontSize: '0.82rem',
                        color: 'var(--text-secondary)', maxHeight: 80, overflow: 'hidden',
                      }}>
                        {step.body.substring(0, 200)}{step.body.length > 200 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Enrollments */}
            {selected.enrollments?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Enrolled Candidates ({selected.enrollments?.length || 0})
                </h4>
                <div className="card" style={{ padding: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Step</th>
                        <th>Status</th>
                        <th>Next Send</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.enrollments?.map((en: any) => (
                        <tr key={en.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{en.candidateName || '—'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{en.candidateEmail}</div>
                          </td>
                          <td>
                            <span className="badge badge-primary">
                              Step {en.currentStep + 1} / {selected.steps?.length || 0}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{
                              background: `${statusColors[en.status] || '#6366f1'}20`,
                              color: statusColors[en.status] || '#6366f1',
                            }}>
                              {en.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {en.nextSendAt ? new Date(en.nextSendAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
