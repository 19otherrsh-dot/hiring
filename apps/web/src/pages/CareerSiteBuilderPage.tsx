import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Save, Eye, Palette, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function CareerSiteBuilderPage() {
  const [settings, setSettings] = useState({
    themeColor: '#000000',
    heroImage: '',
    aboutTitle: 'Welcome to our team',
    aboutText: 'We are building the future. Join us!',
    logoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.getMyOrganization()
      .then((org) => {
        if (org?.settings?.careerSite) {
          setSettings(org.settings.careerSite);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const org = await api.getMyOrganization();
      const currentSettings = org?.settings || {};
      await api.updateOrganizationSettings({
        ...currentSettings,
        careerSite: settings,
      });
      showToast('Career site settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="fade-in pulse" style={{ padding: 40 }}>Loading builder...</div>;

  return (
    <div className="fade-in container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Career Site Builder</h1>
          <p className="page-subtitle">Customize your public job portal design.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => window.open('/careers', '_blank')}>
            <Eye size={16} /> Preview
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : <><Save size={16} /> Publish Changes</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 24, marginTop: 24 }}>
        {/* Editor sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <Palette size={18} /> Branding
            </h3>
            
            <div className="input-group">
              <label>Theme Color</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={settings.themeColor} 
                  onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                  style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                />
                <input 
                  type="text" 
                  className="input" 
                  value={settings.themeColor} 
                  onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: 16 }}>
              <label>Company Logo URL</label>
              <input 
                className="input" 
                placeholder="https://example.com/logo.png" 
                value={settings.logoUrl}
                onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <ImageIcon size={18} /> Hero Section
            </h3>
            
            <div className="input-group">
              <label>Hero Image URL</label>
              <input 
                className="input" 
                placeholder="https://..." 
                value={settings.heroImage}
                onChange={(e) => setSettings({...settings, heroImage: e.target.value})}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Used as the background for the top header.</p>
            </div>

            <div className="input-group" style={{ marginTop: 16 }}>
              <label>Headline</label>
              <input 
                className="input" 
                value={settings.aboutTitle}
                onChange={(e) => setSettings({...settings, aboutTitle: e.target.value})}
              />
            </div>

            <div className="input-group" style={{ marginTop: 16 }}>
              <label>About Description</label>
              <textarea 
                className="input" 
                rows={4}
                value={settings.aboutText}
                onChange={(e) => setSettings({...settings, aboutText: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--color-surface)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8, flex: 1, textAlign: 'center' }}>careers.example.com</div>
          </div>
          
          <div style={{ padding: 0, flex: 1, pointerEvents: 'none', background: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' }}>
            <div style={{ 
              background: settings.themeColor, 
              color: 'white', 
              padding: '60px 40px',
              backgroundImage: settings.heroImage ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${settings.heroImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}>
              {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" style={{ height: 40, marginBottom: 20 }} />}
              <h1 style={{ fontSize: '2.5rem', marginBottom: 12, fontWeight: 700 }}>{settings.aboutTitle}</h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 600, lineHeight: 1.6 }}>{settings.aboutText}</p>
            </div>
            
            <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Open Positions</h2>
                <div style={{ background: '#e2e8f0', width: 200, height: 36, borderRadius: 18 }} />
              </div>
              
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Software Engineer (Mock)</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.85rem', color: '#64748b' }}>
                      <span style={{ border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 4 }}>Engineering</span>
                      <span style={{ border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 4 }}>Remote</span>
                    </div>
                  </div>
                  <div style={{ background: settings.themeColor, padding: '8px 24px', borderRadius: 8, color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>Apply</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
