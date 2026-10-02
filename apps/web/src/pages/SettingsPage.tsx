import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Settings as SettingsIcon, User, Lock, Building2, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Account form
  const [name, setName] = useState(user?.name || '');

  // Company form (recruiters)
  const [company, setCompany] = useState({
    companyName: '',
    companyWebsite: '',
    companyDesc: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Load company info from user data
    api.getMe().then((u: any) => {
      setName(u.name || '');
      setCompany({
        companyName: u.companyName || '',
        companyWebsite: u.companyWebsite || '',
        companyDesc: u.companyDesc || '',
      });
    }).catch(() => {});
  }, []);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      await api.updateSettings({ name });
      showMessage('success', 'Profile updated successfully');
    } catch (err: any) {
      showMessage('error', err.message);
    }
    setSaving(false);
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await api.updateSettings(company);
      showMessage('success', 'Company profile updated');
    } catch (err: any) {
      showMessage('error', err.message);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showMessage('success', 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showMessage('error', err.message);
    }
    setSaving(false);
  };

  const tabs = [
    { key: 'account', label: 'Account', icon: <User size={16} /> },
    ...(user?.role === 'RECRUITER' ? [{ key: 'company', label: 'Company', icon: <Building2 size={16} /> }] : []),
    { key: 'password', label: 'Security', icon: <Lock size={16} /> },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SettingsIcon size={28} style={{ display: 'inline', marginRight: 12, verticalAlign: 'middle' }} />
            Settings
          </h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className="fade-in"
          style={{
            background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 24,
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'settings-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="card settings-section fade-in">
          <h3 style={{ marginBottom: 20 }}>Personal Information</h3>
          <div className="auth-form">
            <div className="input-group">
              <label>Email</label>
              <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email cannot be changed</span>
            </div>
            <div className="input-group">
              <label>Full Name</label>
              <input
                className="input"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Role</label>
              <input className="input" value={user?.role?.replace('_', ' ') || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <button className="btn btn-primary" onClick={handleSaveAccount} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && user?.role === 'RECRUITER' && (
        <div className="card settings-section fade-in">
          <h3 style={{ marginBottom: 20 }}>Company Profile</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
            This information will be shown to job seekers on your job postings.
          </p>
          <div className="auth-form">
            <div className="input-group">
              <label>Company Name</label>
              <input
                className="input"
                placeholder="e.g. Acme Corporation"
                value={company.companyName}
                onChange={e => setCompany({ ...company, companyName: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Website</label>
              <input
                className="input"
                placeholder="https://www.acme.com"
                value={company.companyWebsite}
                onChange={e => setCompany({ ...company, companyWebsite: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea
                className="input"
                placeholder="Tell candidates about your company culture, mission, and values…"
                value={company.companyDesc}
                onChange={e => setCompany({ ...company, companyDesc: e.target.value })}
                style={{ minHeight: 120 }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveCompany} disabled={saving}>
              {saving ? 'Saving…' : '🏢 Update Company Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card settings-section fade-in">
          <h3 style={{ marginBottom: 20 }}>Change Password</h3>
          <div className="auth-form">
            <div className="input-group">
              <label>Current Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min 6 characters"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Repeat new password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
              {saving ? 'Changing…' : '🔒 Change Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
