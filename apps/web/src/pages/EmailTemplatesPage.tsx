import React, { useState } from 'react';
import { Mail, Plus, Edit2, Trash2 } from 'lucide-react';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([
    { id: '1', name: 'Interview Invitation', subject: 'Interview with {{company}} for {{jobTitle}}', body: 'Hi {{candidateName}},\n\nWe would like to invite you to an interview...' },
    { id: '2', name: 'Rejection Notification', subject: 'Update regarding your application', body: 'Dear {{candidateName}},\n\nThank you for applying to {{company}}...' },
    { id: '3', name: 'Offer Extended', subject: 'Job Offer from {{company}}', body: 'Hi {{candidateName}},\n\nWe are thrilled to extend an offer for the position of {{jobTitle}}...' },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });

  const handleEdit = (tmpl: any) => {
    setEditingId(tmpl.id);
    setForm({ name: tmpl.name, subject: tmpl.subject, body: tmpl.body });
  };

  const handleSave = () => {
    if (editingId) {
      setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, ...form } : t));
    } else {
      setTemplates(prev => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setEditingId(null);
    setForm({ name: '', subject: '', body: '' });
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fade-in container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title"><Mail size={24} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8 }} /> Email Templates</h1>
          <p className="page-subtitle">Manage reusable email templates for status changes and workflows.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId(''); setForm({ name: '', subject: '', body: '' }); }}>
          <Plus size={16} /> New Template
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editingId !== null ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Template List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map(tmpl => (
            <div key={tmpl.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent-primary)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{tmpl.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subject: {tmpl.subject}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => handleEdit(tmpl)}><Edit2 size={14} /></button>
                <button className="btn btn-outline btn-sm" onClick={() => handleDelete(tmpl.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="empty-state">No templates found. Create your first template!</div>
          )}
        </div>

        {/* Editor */}
        {editingId !== null && (
          <div className="card fade-in">
            <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>{editingId ? 'Edit Template' : 'New Template'}</h2>
            <div className="input-group">
              <label>Template Name</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Interview Invite" />
            </div>
            <div className="input-group">
              <label>Subject Line</label>
              <input className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g., Interview with {{company}}" />
            </div>
            <div className="input-group">
              <label>Email Body</label>
              <textarea 
                className="input" 
                rows={8} 
                value={form.body} 
                onChange={e => setForm({...form, body: e.target.value})}
                placeholder="Write your email body here. Use {{candidateName}}, {{jobTitle}}, etc. for dynamic inserts."
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Available variables: <span style={{ fontFamily: 'monospace' }}>{`{{candidateName}}, {{jobTitle}}, {{company}}, {{recruiterName}}`}</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name || !form.subject || !form.body}>
                Save Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
