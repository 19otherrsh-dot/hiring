import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Building, Plus, Trash2, ShieldCheck, User } from 'lucide-react';

export default function OrganizationSettings() {
  const { user } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newDept, setNewDept] = useState('');
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'RECRUITER',
    departmentId: ''
  });

  useEffect(() => {
    loadOrg();
  }, []);

  const loadOrg = async () => {
    try {
      const data = await api.getMyOrganization();
      setOrg(data);
    } catch (err: any) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept) return;
    try {
      await api.createDepartment(newDept);
      setNewDept('');
      loadOrg();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.inviteUser(inviteForm);
      setInviteForm({ email: '', name: '', role: 'RECRUITER', departmentId: '' });
      loadOrg();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (user?.role !== 'ORG_ADMIN') {
    return (
      <div className="empty-state fade-in">
        <div className="empty-state-icon">🔒</div>
        <p>Organization Settings are restricted to ORG_ADMIN role.</p>
      </div>
    );
  }

  if (loading) return <div className="fade-in pulse" style={{ padding: 40 }}>Loading organization...</div>;
  if (!org) return <div className="empty-state">Not assigned to an organization.</div>;

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Building size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} /> {org.name} Settings</h1>
          <p className="page-subtitle">Manage departments, roles, and teammates</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Users / Invites */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} /> Teammates ({org.users?.length})
            </h3>
            
            <form onSubmit={handleInvite} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 600 }}>Invite New Teammate</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input required className="input" placeholder="Name" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} style={{ flex: 1 }} />
                <input required type="email" className="input" placeholder="Email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} style={{ flex: 1.5 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <select className="input" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} style={{ flex: 1 }}>
                  <option value="ORG_ADMIN">Admin</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="HIRING_MANAGER">Hiring Manager</option>
                  <option value="INTERVIEWER">Interviewer</option>
                </select>
                <select className="input" value={inviteForm.departmentId} onChange={e => setInviteForm({...inviteForm, departmentId: e.target.value})} style={{ flex: 1 }}>
                  <option value="">No Department</option>
                  {org.departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                <Plus size={14} /> Send Invite
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {org.users?.map((u: any) => (
                <div key={u.id} style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name || 'Unknown'} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({u.email})</span></div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className="badge" style={{ fontSize: '0.65rem' }}>{u.role.replace('_', ' ')}</span>
                      {u.department && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{u.department.name}</span>}
                    </div>
                  </div>
                  {u.role === 'ORG_ADMIN' ? <ShieldCheck size={18} style={{ color: '#10b981' }} /> : <User size={18} style={{ color: 'var(--text-muted)' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="card">
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={18} /> Departments
            </h3>
            
            <form onSubmit={handleCreateDept} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input required className="input" placeholder="New department name..." value={newDept} onChange={e => setNewDept(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" style={{ shrink: 0 }}>Add</button>
            </form>

            <div style={{ display: 'grid', gap: 8 }}>
              {org.departments?.length > 0 ? org.departments.map((d: any) => (
                <div key={d.id} style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>{d.name}</span>
                </div>
              )) : (
                <div className="empty-state" style={{ padding: 20 }}>No departments configured.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
