import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Shield, Eye, EyeOff, Users, BarChart3, TrendingUp, PieChart } from 'lucide-react';

export default function CompliancePage() {
  const { user } = useAuth();
  const isRecruiter = user?.role === 'RECRUITER';

  if (!isRecruiter) return <CandidateDeiView />;
  return <RecruiterDeiDashboard />;
}

function RecruiterDeiDashboard() {
  const [deiData, setDeiData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [dei, jobsData] = await Promise.all([
        api.getDeiAnalytics(),
        api.getMyJobs(),
      ]);
      setDeiData(dei);
      setJobs(jobsData);
    } catch (err) {}
    setLoading(false);
  }

  async function toggleBlind(jobId: string, current: boolean) {
    try {
      await api.toggleBlindScreening(jobId, !current);
      const updated = await api.getMyJobs();
      setJobs(updated);
    } catch (err: any) { alert(err.message); }
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="pulse">Loading DEI data...</div>
      </div>
    );
  }

  const stats = [
    { icon: <Users size={22} />, label: 'Total Applications', value: deiData?.totalApplications || 0, color: '#6366f1' },
    { icon: <TrendingUp size={22} />, label: 'Total Hired', value: deiData?.totalHired || 0, color: '#10b981' },
    { icon: <BarChart3 size={22} />, label: 'Response Rate', value: `${deiData?.responseRate || 0}%`, color: '#06b6d4' },
    { icon: <Shield size={22} />, label: 'Blind Jobs', value: jobs.filter((j: any) => j.blindScreening).length, color: '#f59e0b' },
  ];

  const maxBarValue = (data: any[]) => Math.max(...data.map(d => d.count), 1);

  function BarChart({ data, title, color }: { data: any[]; title: string; color: string }) {
    const max = maxBarValue(data);
    if (data.length === 0) {
      return (
        <div className="card">
          <h4 style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No data collected yet</p>
        </div>
      );
    }
    return (
      <div className="card">
        <h4 style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((item: any) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.count}</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(item.count / max) * 100}%`,
                  background: color,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                  animation: 'barGrow 0.8s ease forwards',
                  transformOrigin: 'left',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">DEI & Compliance 🛡️</h1>
          <p className="page-subtitle">Diversity, Equity & Inclusion analytics — fully anonymized</p>
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

      {/* DEI Charts */}
      <h3 style={{ marginBottom: 16 }}>Demographic Breakdown</h3>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20, marginBottom: 32
      }}>
        <BarChart data={deiData?.gender || []} title="Gender Distribution" color="#6366f1" />
        <BarChart data={deiData?.ethnicity || []} title="Ethnicity Distribution" color="#06b6d4" />
        <BarChart data={deiData?.veteranStatus || []} title="Veteran Status" color="#10b981" />
        <BarChart data={deiData?.disabilityStatus || []} title="Disability Status" color="#f59e0b" />
      </div>

      {/* Blind Screening Toggle */}
      <h3 style={{ marginBottom: 16 }}>Blind Screening Settings</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>
        When enabled, candidate names and emails are hidden from recruiters during evaluation to reduce unconscious bias.
      </p>
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Location</th>
              <th>Applicants</th>
              <th>Blind Screening</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job: any) => (
              <tr key={job.id}>
                <td style={{ fontWeight: 600 }}>{job.title}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{job.location}</td>
                <td><span className="badge badge-primary">{job._count?.applications || 0}</span></td>
                <td>
                  <button
                    className={`btn btn-sm ${job.blindScreening ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => toggleBlind(job.id, job.blindScreening)}
                    style={{ minWidth: 100 }}
                  >
                    {job.blindScreening ? <><EyeOff size={14} /> Enabled</> : <><Eye size={14} /> Disabled</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: 24, padding: 20, borderRadius: 'var(--radius-md)',
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-primary-light)' }}>📋 EEOC Compliance Note:</strong> All demographic data shown above is voluntarily
          self-reported by candidates and is stored separately from application evaluation data. It is only used
          in aggregate for compliance reporting and is never visible during the hiring evaluation process.
        </p>
      </div>
    </div>
  );
}

function CandidateDeiView() {
  const [applications, setApplications] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({ gender: '', ethnicity: '', veteranStatus: '', disabilityStatus: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getMyApplications().then(setApplications).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.submitDemographics({ applicationId: selected, ...form });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Voluntary Self-Identification</h1>
          <p className="page-subtitle">Help us build a more diverse & inclusive workplace</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{
          padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20,
          background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <strong style={{ color: '#06b6d4' }}>This is voluntary.</strong> Your responses will not affect your candidacy.
            Data is only used in anonymous aggregate reporting to comply with federal regulations.
          </p>
        </div>

        {submitted && (
          <div style={{
            padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 20,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', fontWeight: 600,
          }}>
            ✅ Thank you for your response!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Select Application</label>
            <select className="input" value={selected} onChange={e => setSelected(e.target.value)} required>
              <option value="">Choose an application...</option>
              {applications.map((a: any) => (
                <option key={a.id} value={a.id}>{a.job?.title} — {a.status}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Gender Identity</label>
            <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label>Ethnicity</label>
            <select className="input" value={form.ethnicity} onChange={e => setForm({ ...form, ethnicity: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="White">White</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="Asian">Asian</option>
              <option value="Native American">Native American or Alaska Native</option>
              <option value="Pacific Islander">Native Hawaiian or Pacific Islander</option>
              <option value="Two or More Races">Two or More Races</option>
            </select>
          </div>
          <div className="input-group">
            <label>Veteran Status</label>
            <select className="input" value={form.veteranStatus} onChange={e => setForm({ ...form, veteranStatus: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="Veteran">I am a veteran</option>
              <option value="Non-veteran">I am not a veteran</option>
            </select>
          </div>
          <div className="input-group">
            <label>Disability Status</label>
            <select className="input" value={form.disabilityStatus} onChange={e => setForm({ ...form, disabilityStatus: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="Yes">Yes, I have a disability</option>
              <option value="No">No, I do not have a disability</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">
            <Shield size={16} /> Submit Response
          </button>
        </form>
      </div>
    </div>
  );
}
