import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { FileText, Send, CheckCircle, XCircle, Clock, DollarSign, Calendar, Award } from 'lucide-react';

export default function OffersPage() {
  const { user } = useAuth();
  const isRecruiter = user?.role === 'RECRUITER';

  return isRecruiter ? <RecruiterOffers /> : <CandidateOffers />;
}

function RecruiterOffers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [form, setForm] = useState({
    applicationId: '', salary: '', currency: 'USD', startDate: '', expiresAt: '', benefits: '', jobTitle: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const o = await api.getMyOffers();
      setOffers(o);
      const j = await api.getMyJobs();
      setJobs(j);
    } catch (err) {}
  }

  async function loadCandidates(jobId: string) {
    setSelectedJob(jobId);
    const job = jobs.find((j: any) => j.id === jobId);
    setForm(f => ({ ...f, jobTitle: job?.title || '' }));
    try {
      const candidates = await api.getJobCandidates(jobId);
      setCandidates(candidates.filter((c: any) => ['SHORTLISTED', 'INTERVIEW'].includes(c.status)));
    } catch (err) {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createOffer({
        ...form,
        salary: parseFloat(form.salary),
      });
      setShowForm(false);
      setForm({ applicationId: '', salary: '', currency: 'USD', startDate: '', expiresAt: '', benefits: '', jobTitle: '' });
      loadData();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  }

  async function handleApprove(id: string) {
    try { await api.approveOffer(id); loadData(); } catch (err: any) { alert(err.message); }
  }

  async function handleSend(id: string) {
    if (!confirm('Send this offer to the candidate? They will receive an email notification.')) return;
    try { await api.sendOffer(id); loadData(); } catch (err: any) { alert(err.message); }
  }

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    DRAFT: { color: '#64748b', icon: <FileText size={14} /> },
    PENDING_APPROVAL: { color: '#f59e0b', icon: <Clock size={14} /> },
    APPROVED: { color: '#06b6d4', icon: <CheckCircle size={14} /> },
    SENT: { color: '#6366f1', icon: <Send size={14} /> },
    ACCEPTED: { color: '#10b981', icon: <CheckCircle size={14} /> },
    DECLINED: { color: '#ef4444', icon: <XCircle size={14} /> },
    EXPIRED: { color: '#64748b', icon: <Clock size={14} /> },
  };

  const stats = [
    { icon: <FileText size={22} />, label: 'Total Offers', value: offers.length, color: '#6366f1' },
    { icon: <Send size={22} />, label: 'Sent', value: offers.filter(o => o.status === 'SENT').length, color: '#06b6d4' },
    { icon: <CheckCircle size={22} />, label: 'Accepted', value: offers.filter(o => o.status === 'ACCEPTED').length, color: '#10b981' },
    { icon: <XCircle size={22} />, label: 'Declined', value: offers.filter(o => o.status === 'DECLINED').length, color: '#ef4444' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Offer Management 📋</h1>
          <p className="page-subtitle">Create, approve, and track offer letters</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FileText size={16} /> New Offer
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

      {showForm && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Create Offer Letter</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Select Job</label>
              <select className="input" value={selectedJob} onChange={e => loadCandidates(e.target.value)} required>
                <option value="">Choose a job...</option>
                {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            {candidates.length > 0 && (
              <div className="input-group">
                <label>Select Candidate</label>
                <select className="input" value={form.applicationId} onChange={e => setForm({ ...form, applicationId: e.target.value })} required>
                  <option value="">Choose a candidate...</option>
                  {candidates.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.applicant?.name || c.applicant?.email} — {c.status}
                      {c.matchScore ? ` (${Math.round(c.matchScore * 100)}% match)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16 }}>
              <div className="input-group">
                <label>Annual Salary *</label>
                <input className="input" type="number" placeholder="120000" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Currency</label>
                <select className="input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label>Start Date *</label>
                <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Offer Expires *</label>
                <input className="input" type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} required />
              </div>
            </div>
            <div className="input-group">
              <label>Benefits & Perks</label>
              <textarea className="input" placeholder="Health insurance, 401k matching, unlimited PTO, stock options..." value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Draft'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Offer Pipeline */}
      <h3 style={{ marginBottom: 16 }}>Offer Pipeline</h3>
      {offers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No offers created yet. Select a candidate and create your first offer!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Position</th>
                <th>Compensation</th>
                <th>Start Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer: any) => {
                const sc = statusConfig[offer.status] || statusConfig.DRAFT;
                return (
                  <tr key={offer.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{offer.application?.applicant?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{offer.application?.applicant?.email}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{offer.jobTitle}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>
                        {offer.currency} {offer.salary?.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(offer.startDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${sc.color}20`, color: sc.color, gap: 4 }}>
                        {sc.icon} {offer.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {offer.status === 'DRAFT' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleApprove(offer.id)}>Approve</button>
                      )}
                      {offer.status === 'PENDING_APPROVAL' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleApprove(offer.id)}>Approve</button>
                      )}
                      {offer.status === 'APPROVED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleSend(offer.id)}>
                          <Send size={12} /> Send
                        </button>
                      )}
                      {offer.candidateNotes && (
                        <span title={offer.candidateNotes} style={{ cursor: 'help', color: 'var(--text-muted)', fontSize: '0.75rem' }}>💬</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CandidateOffers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [responding, setResponding] = useState('');

  useEffect(() => {
    api.getMyOffers().then(setOffers).catch(() => {});
  }, []);

  async function handleRespond(offerId: string, response: 'ACCEPTED' | 'DECLINED') {
    const notes = response === 'DECLINED' ? prompt('Any feedback? (optional)') || '' : '';
    setResponding(offerId);
    try {
      await api.respondToOffer(offerId, response, notes);
      const updated = await api.getMyOffers();
      setOffers(updated);
    } catch (err: any) { alert(err.message); }
    setResponding('');
  }

  if (offers.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Offers</h1>
            <p className="page-subtitle">View and respond to offer letters</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📬</div>
          <p>No offers received yet. Keep applying!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Offers 🎉</h1>
          <p className="page-subtitle">Review and respond to your offer letters</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {offers.map((offer: any) => (
          <div className="card" key={offer.id} style={{
            borderLeft: `4px solid ${offer.status === 'ACCEPTED' ? '#10b981' : offer.status === 'DECLINED' ? '#ef4444' : '#6366f1'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{offer.jobTitle}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {offer.application?.job?.recruiter?.companyName || 'Company'}
                </p>
              </div>
              <span className={`badge ${offer.status === 'ACCEPTED' ? 'badge-success' : offer.status === 'DECLINED' ? 'badge-danger' : 'badge-primary'}`}>
                {offer.status}
              </span>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16, padding: 20, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)', marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DollarSign size={18} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compensation</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{offer.currency} {offer.salary?.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={18} style={{ color: '#06b6d4' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Date</div>
                  <div style={{ fontWeight: 600 }}>{new Date(offer.startDate).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={18} style={{ color: '#f59e0b' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expires</div>
                  <div style={{ fontWeight: 600 }}>{new Date(offer.expiresAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {offer.benefits && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Benefits & Perks</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{offer.benefits}</p>
              </div>
            )}

            {offer.status === 'SENT' && (
              <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleRespond(offer.id, 'ACCEPTED')}
                  disabled={responding === offer.id}
                >
                  <CheckCircle size={16} /> Accept Offer
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRespond(offer.id, 'DECLINED')}
                  disabled={responding === offer.id}
                >
                  <XCircle size={16} /> Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
