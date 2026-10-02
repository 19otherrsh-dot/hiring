import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, Info } from 'lucide-react';

export default function PostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    skillsRequired: '',
    location: '',
    salaryRange: '',
    seniority: '',
    industry: '',
    blindScreening: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createJob({
        ...form,
        skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
      });
      navigate('/');
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  if (user?.role !== 'RECRUITER') {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">🔒</div>
        <p>Only recruiters can post jobs.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Post a New Job</h1>
          <p className="page-subtitle">Fill in the details to attract the right candidates</p>
        </div>
      </div>

      <div className="card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Job Title *</label>
            <input className="input" placeholder="e.g. Senior React Developer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Description *</label>
            <textarea className="input" placeholder="Describe the role, responsibilities, and requirements…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ minHeight: 160 }} />
          </div>
          <div className="input-group">
            <label>Required Skills (comma-separated)</label>
            <input className="input" placeholder="React, TypeScript, Node.js, PostgreSQL" value={form.skillsRequired} onChange={e => setForm({ ...form, skillsRequired: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="input-group">
              <label>Location *</label>
              <input className="input" placeholder="e.g. Mumbai, Remote" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Salary Range</label>
              <input className="input" placeholder="e.g. ₹12–18 LPA" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="input-group">
              <label>Seniority Level</label>
              <select className="input" value={form.seniority} onChange={e => setForm({ ...form, seniority: e.target.value })}>
                <option value="">Select level…</option>
                <option value="INTERN">Intern</option>
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid-Level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead</option>
                <option value="PRINCIPAL">Principal</option>
              </select>
            </div>
            <div className="input-group">
              <label>Industry</label>
              <select className="input" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                <option value="">Select industry…</option>
                <option value="Technology">Technology</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Education">Education</option>
                <option value="Design">Design</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Blind Screening Toggle */}
          <div
            style={{
              background: form.blindScreening ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)',
              border: `1px solid ${form.blindScreening ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onClick={() => setForm({ ...form, blindScreening: !form.blindScreening })}
          >
            <div style={{
              width: 40, height: 22, borderRadius: 11,
              background: form.blindScreening
                ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                : 'var(--border-color)',
              position: 'relative',
              transition: 'background 0.25s',
              flexShrink: 0,
              marginTop: 2,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'white',
                position: 'absolute', top: 2,
                left: form.blindScreening ? 20 : 2,
                transition: 'left 0.25s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Shield size={16} style={{ color: form.blindScreening ? '#10b981' : 'var(--text-muted)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Blind Screening</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Hide candidate names and emails during review to reduce unconscious bias. Recruiters will see skills and experience only.
              </p>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Publishing…' : '🚀 Publish Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
