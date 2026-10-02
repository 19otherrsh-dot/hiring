import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Zap, Plus, Settings, MessageSquare, Mail, Trash2 } from 'lucide-react';

export default function WorkflowAutomation() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    stageName: 'Technical',
    event: 'STAGE_ENTERED',
    actionType: 'SEND_SLACK_NOTIF',
    channel: '#hiring-alerts'
  });

  useEffect(() => {
    if (user?.role === 'ORG_ADMIN' || user?.role === 'RECRUITER') {
      api.getMyJobs().then(setJobs).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (selectedJob) {
      loadTriggers(selectedJob);
    } else {
      setTriggers([]);
    }
  }, [selectedJob]);

  const loadTriggers = async (jobId: string) => {
    setLoading(true);
    try {
      const data = await api.getJobTriggers(jobId);
      setTriggers(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      await api.createJobTrigger(selectedJob, {
        stageName: form.stageName,
        event: form.event,
        actionType: form.actionType,
        metadata: { channel: form.channel }
      });
      loadTriggers(selectedJob);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTrigger(id);
      loadTriggers(selectedJob);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Zap size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle', color: '#f59e0b' }} /> Workflow Automation</h1>
          <p className="page-subtitle">Configure automated actions based on candidate status changes</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Select Job</h3>
        <select className="input" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
          <option value="">Choose a job to configure workflows...</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </div>

      {selectedJob && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Create Form */}
          <form className="card fade-in" onSubmit={handleCreate} style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> New Trigger Rule</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto minmax(200px, 1fr)', gap: 16, alignItems: 'center', background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>WHEN CANDIDATE MOVES TO</label>
                <select className="input" value={form.stageName} onChange={e => setForm({...form, stageName: e.target.value})}>
                  <option value="REVIEWING">Reviewing Stage</option>
                  <option value="SHORTLISTED">Shortlisted Stage</option>
                  <option value="Technical">Technical Stage (If applicable)</option>
                  <option value="INTERVIEW">Interview Stage</option>
                  <option value="HIRED">Hired Stage</option>
                </select>
              </div>
              
              <div style={{ marginTop: 24, color: 'var(--text-muted)' }}>👉</div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>THEN AUTOMATICALLY</label>
                <select className="input" value={form.actionType} onChange={e => setForm({...form, actionType: e.target.value})} style={{ marginBottom: 8 }}>
                  <option value="SEND_SLACK_NOTIF">Notify Slack Channel</option>
                  <option value="SEND_EMAIL">Send Email Template</option>
                </select>
                {form.actionType === 'SEND_SLACK_NOTIF' && (
                  <input className="input" placeholder="e.g. #hiring-alerts" value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} />
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Save Rule</button>
          </form>

          {/* List Triggers */}
          <div>
            <h3 style={{ margin: '0 0 16px' }}>Active Rules ({triggers.length})</h3>
            {loading ? <p>Loading...</p> : triggers.length === 0 ? (
              <div className="empty-state">No workflow triggers configured for this job.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {triggers.map(t => (
                  <div key={t.id} className="card fade-in" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', borderRadius: '50%', color: '#f59e0b' }}>
                        {t.actionType === 'SEND_SLACK_NOTIF' ? <MessageSquare size={18} /> : <Mail size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>
                          When entered <span className="badge">{t.stageName || 'Any stage'}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Run action: <span style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{t.actionType}</span>
                          {t.metadata?.channel && ` to ${t.metadata.channel}`}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(t.id)} title="Delete rule">
                      <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
