import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { UserPlus, Users, Award, TrendingUp, Send, ChevronDown } from 'lucide-react';

export default function ReferralsPage() {
  const { user } = useAuth();
  const isRecruiter = user?.role === 'RECRUITER';

  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ jobId: '', candidateName: '', candidateEmail: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const myRefs = await api.getMyReferrals();
      setReferrals(myRefs);
      if (isRecruiter) {
        const s = await api.getReferralStats();
        setStats(s);
        const j = await api.getMyJobs();
        setJobs(j);
      } else {
        const jobData = await api.getJobs({ page: 1 });
        setJobs(jobData.jobs || []);
      }
    } catch (err) {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.jobId || !form.candidateName || !form.candidateEmail) return;
    setSubmitting(true);
    try {
      await api.submitReferral(form);
      setSuccessMsg('Referral submitted! An invite email has been sent.');
      setForm({ jobId: '', candidateName: '', candidateEmail: '', notes: '' });
      setShowForm(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  }

  async function handleStatusChange(refId: string, status: string) {
    try {
      await api.updateReferralStatus(refId, status);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONTACTED: '#06b6d4',
    APPLIED: '#6366f1',
    INTERVIEWING: '#818cf8',
    HIRED: '#10b981',
    REJECTED: '#ef4444',
  };

  const summaryStats = [
    { icon: <UserPlus size={22} />, label: 'My Referrals', value: referrals.length, color: '#6366f1' },
    { icon: <TrendingUp size={22} />, label: 'In Progress', value: referrals.filter(r => ['CONTACTED', 'APPLIED', 'INTERVIEWING'].includes(r.status)).length, color: '#06b6d4' },
    { icon: <Award size={22} />, label: 'Hired', value: referrals.filter(r => r.status === 'HIRED').length, color: '#10b981' },
    { icon: <Users size={22} />, label: 'Total Pool', value: stats?.statusBreakdown?.total || referrals.length, color: '#f59e0b' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Referrals 🌟</h1>
          <p className="page-subtitle">Refer talented people to open positions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={16} /> Submit Referral
        </button>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24,
          color: '#10b981', fontWeight: 600
        }}>
          ✅ {successMsg}
        </div>
      )}

      <div className="stat-grid">
        {summaryStats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Submit a Referral</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Job Position *</label>
              <select className="input" value={form.jobId} onChange={e => setForm({ ...form, jobId: e.target.value })} required>
                <option value="">Select a job...</option>
                {jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.location}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label>Candidate Name *</label>
                <input className="input" placeholder="Jane Smith" value={form.candidateName} onChange={e => setForm({ ...form, candidateName: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Candidate Email *</label>
                <input className="input" type="email" placeholder="jane@example.com" value={form.candidateEmail} onChange={e => setForm({ ...form, candidateEmail: e.target.value })} required />
              </div>
            </div>
            <div className="input-group">
              <label>Notes (optional)</label>
              <textarea className="input" placeholder="Why would this person be a great fit?" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Referral'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Leaderboard (Recruiter only) */}
      {isRecruiter && stats?.topReferrers?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 16 }}>🏆 Top Referrers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {stats.topReferrers.slice(0, 5).map((ref: any, i: number) => (
              <div className="card" key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem', color: 'white'
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ref.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ref.count} referrals · {ref.hired} hired
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals Table */}
      <h3 style={{ marginBottom: 16 }}>{isRecruiter ? 'All Referrals' : 'My Referrals'}</h3>
      {referrals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <p>No referrals yet. Know someone who'd be great? Submit a referral!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Position</th>
                <th>Status</th>
                <th>Submitted</th>
                {isRecruiter && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(isRecruiter ? stats?.referrals || [] : referrals).map((ref: any) => (
                <tr key={ref.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ref.candidateName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ref.candidateEmail}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{ref.job?.title}</td>
                  <td>
                    <span className="badge" style={{
                      background: `${statusColors[ref.status] || '#6366f1'}20`,
                      color: statusColors[ref.status] || '#6366f1'
                    }}>
                      {ref.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </td>
                  {isRecruiter && (
                    <td>
                      <select
                        className="input"
                        value={ref.status}
                        onChange={e => handleStatusChange(ref.id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.78rem', minWidth: 120 }}
                      >
                        {['PENDING', 'CONTACTED', 'APPLIED', 'INTERVIEWING', 'HIRED', 'REJECTED'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
