import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [form, setForm] = useState({
    skills: '',
    experienceYears: 0,
    educationTier: '',
    location: '',
    headline: '',
  });

  useEffect(() => {
    api.getProfile().then(p => {
      if (p && !p.message) {
        setProfile(p);
        setForm({
          skills: (p.skills || []).join(', '),
          experienceYears: p.experienceYears || 0,
          educationTier: p.educationTier || '',
          location: p.location || '',
          headline: p.headline || '',
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setProfile(res);
    } catch (err: any) {
      alert(err.message);
    }
    setSaving(false);
  };

  const handleParse = async () => {
    if (!resumeText.trim()) return;
    setParsing(true);
    try {
      const parsed = await api.parseResume(resumeText);
      setForm(prev => ({
        ...prev,
        skills: parsed.skills?.join(', ') || prev.skills,
        experienceYears: parsed.experience_years || prev.experienceYears,
        educationTier: parsed.education || prev.educationTier,
      }));
    } catch (err: any) {
      alert('AI parsing failed: ' + err.message);
    }
    setParsing(false);
  };

  if (loading) return <div className="empty-state pulse">Loading profile…</div>;

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">{user?.email}</p>
        </div>
      </div>

      {/* AI Resume Parser */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>📄 Upload Resume (PDF)</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
          Upload a PDF resume and our AI will automatically extract your skills, experience, and education.
        </p>
        <input
          type="file"
          accept=".pdf,.txt"
          id="resume-upload"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setParsing(true);
            try {
              const result = await api.uploadResume(file);
              if (result.profile) {
                setProfile(result.profile);
                setForm({
                  skills: (result.profile.skills || []).join(', '),
                  experienceYears: result.profile.experienceYears || 0,
                  educationTier: result.profile.educationTier || '',
                  location: result.profile.location || form.location,
                  headline: result.profile.headline || form.headline,
                });
              }
              alert(`✅ Resume parsed! Found ${result.parsed?.skills?.length || 0} skills.`);
            } catch (err: any) {
              alert('Upload failed: ' + err.message);
            }
            setParsing(false);
          }}
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label htmlFor="resume-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {parsing ? '⏳ Processing…' : '📎 Choose File'}
          </label>
          {profile?.resumeFileUrl && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              ✅ Resume uploaded
            </span>
          )}
        </div>
      </div>

      {/* Text Resume Parser */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>🤖 Or Paste Resume Text</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
          Alternatively, paste your resume text below and let our AI extract your skills.
        </p>
        <textarea
          className="input"
          placeholder="Paste your resume text here…"
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          style={{ minHeight: 120, marginBottom: 12 }}
        />
        <button className="btn btn-secondary" onClick={handleParse} disabled={parsing}>
          {parsing ? 'Parsing…' : '✨ Extract from Resume'}
        </button>
      </div>

      {/* Profile Form */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Profile Details</h3>
        <form className="auth-form" onSubmit={handleSave}>
          <div className="input-group">
            <label>Headline</label>
            <input className="input" placeholder="e.g. Full-Stack Developer" value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Skills (comma-separated)</label>
            <input className="input" placeholder="React, Node.js, Python" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="input-group">
              <label>Experience (years)</label>
              <input type="number" className="input" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="input-group">
              <label>Education</label>
              <input className="input" placeholder="e.g. B.Tech, BCA, MBA" value={form.educationTier} onChange={e => setForm({ ...form, educationTier: e.target.value })} />
            </div>
          </div>
          <div className="input-group">
            <label>Location</label>
            <input className="input" placeholder="e.g. Pune, Mumbai" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
