import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('JOB_SEEKER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, role);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="sidebar-logo" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}>
          HireFlow AI
        </div>
        <p className="auth-subtitle">Create your account and start hiring or get hired</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>I am a…</label>
            <div className="role-toggle">
              <button type="button" className={`role-toggle-btn ${role === 'JOB_SEEKER' ? 'active' : ''}`} onClick={() => setRole('JOB_SEEKER')}>
                Job Seeker
              </button>
              <button type="button" className={`role-toggle-btn ${role === 'RECRUITER' ? 'active' : ''}`} onClick={() => setRole('RECRUITER')}>
                Recruiter
              </button>
            </div>
          </div>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" className="input" placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" className="input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
