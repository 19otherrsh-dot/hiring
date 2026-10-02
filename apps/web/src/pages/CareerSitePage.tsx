import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  MapPin, Briefcase, Clock, ExternalLink, Search,
  Building2, ChevronRight, Globe, Sparkles
} from 'lucide-react';

export default function CareerSitePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // We parse the URL for a 'company' query param to know which tenant to load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('company');
    loadJobs(undefined, undefined, companyId);
    
    if (companyId) {
      api.getPublicOrganization(companyId).then(org => {
        if (org?.settings?.careerSite) {
          setSettings(org.settings.careerSite);
        }
      }).catch(console.error);
    }
  }, []);

  const loadJobs = async (s?: string, loc?: string, companyId?: string | null) => {
    setLoading(true);
    try {
      const data = await api.getPublicJobs({
        search: s || undefined,
        location: loc || undefined,
        company: companyId || undefined,
      });
      setJobs(data.jobs || []);
      if (data.jobs?.length > 0 && data.jobs[0]?.recruiter) {
        setCompanyInfo(data.jobs[0].recruiter);
      }
    } catch {
      setJobs([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    loadJobs(search, locationFilter);
  };

  const seniorityLabel: Record<string, string> = {
    INTERN: 'Internship',
    JUNIOR: 'Junior',
    MID: 'Mid-Level',
    SENIOR: 'Senior',
    LEAD: 'Lead',
    PRINCIPAL: 'Principal',
  };

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div style={{
        background: settings?.themeColor || 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08), rgba(16,185,129,0.06))',
        backgroundImage: settings?.heroImage ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${settings.heroImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: settings?.heroImage ? 'white' : 'inherit',
        borderRadius: 'var(--radius-lg)',
        padding: '60px 32px',
        marginBottom: 32,
        textAlign: 'center',
        border: settings?.heroImage ? 'none' : '1px solid rgba(99,102,241,0.15)',
      }}>
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} alt="Company Logo" style={{ height: 60, margin: '0 auto 16px', display: 'block', borderRadius: 8 }} />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Globe size={28} style={{ color: 'white' }} />
          </div>
        )}
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 12 }}>
          {settings?.aboutTitle || 'Career Opportunities'}
        </h1>
        <p style={{ color: settings?.heroImage ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
          {settings?.aboutText || 'Join amazing teams working on products that matter. Find your next opportunity.'}
        </p>

        {/* Search bar */}
        <div style={{
          display: 'flex', gap: 10, maxWidth: 600, margin: '0 auto',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search roles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <div style={{ flex: '1 1 180px', position: 'relative' }}>
            <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Location…"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} style={{ height: 44 }}>
            <Search size={16} /> Search
          </button>
        </div>
      </div>

      {/* Layout: Jobs list + Detail panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedJob ? '1fr 1.2fr' : '1fr',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Jobs List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>
              {loading ? 'Loading…' : `${jobs.length} Open Position${jobs.length !== 1 ? 's' : ''}`}
            </h2>
          </div>

          {jobs.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p>No matching positions found. Try adjusting your search.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="card"
                  onClick={() => setSelectedJob(job)}
                  style={{
                    padding: '18px 20px',
                    cursor: 'pointer',
                    borderLeft: selectedJob?.id === job.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    transition: 'all 0.2s',
                    background: selectedJob?.id === job.id ? 'var(--bg-elevated)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>
                        {job.title}
                      </h3>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {job.recruiter?.companyName && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={13} /> {job.recruiter.companyName}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {job.location}
                        </span>
                        {job.seniority && (
                          <span className="badge" style={{ fontSize: '0.7rem' }}>
                            {seniorityLabel[job.seniority] || job.seniority}
                          </span>
                        )}
                      </div>
                      {job.salaryRange && (
                        <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                          {job.salaryRange}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {(job.skillsRequired || []).slice(0, 4).map((s: string) => (
                          <span key={s} className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{s}</span>
                        ))}
                        {(job.skillsRequired || []).length > 4 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            +{job.skillsRequired.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedJob && (
          <div className="card fade-in" style={{
            position: 'sticky', top: 20, padding: '28px 24px',
            maxHeight: 'calc(100vh - 40px)', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem' }}>{selectedJob.title}</h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedJob.recruiter?.companyName && (
                    <span><Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />{selectedJob.recruiter.companyName}</span>
                  )}
                  <span><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />{selectedJob.location}</span>
                  <span><Clock size={14} style={{ display: 'inline', marginRight: 4 }} />{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => window.open(`/login`, '_blank')}
                style={settings?.themeColor ? { background: settings.themeColor, border: 'none' } : {}}
              >
                Apply Now
              </button>
            </div>

            {/* Meta badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {selectedJob.seniority && (
                <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                  📊 {seniorityLabel[selectedJob.seniority] || selectedJob.seniority}
                </span>
              )}
              {selectedJob.industry && (
                <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                  🏢 {selectedJob.industry}
                </span>
              )}
              {selectedJob.salaryRange && (
                <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  💰 {selectedJob.salaryRange}
                </span>
              )}
            </div>

            {/* Skills */}
            {selectedJob.skillsRequired?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 10, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Required Skills
                </h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedJob.skillsRequired.map((s: string) => (
                    <span key={s} className="badge badge-primary">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 style={{ marginBottom: 10, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                About This Role
              </h4>
              <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                {selectedJob.description}
              </p>
            </div>

            {/* Company info */}
            {selectedJob.recruiter?.companyDesc && (
              <div style={{
                marginTop: 24, paddingTop: 20,
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <h4 style={{ marginBottom: 10, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  About {selectedJob.recruiter.companyName}
                </h4>
                <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  {selectedJob.recruiter.companyDesc}
                </p>
                {selectedJob.recruiter.companyWebsite && (
                  <a
                    href={selectedJob.recruiter.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--accent-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    <ExternalLink size={14} /> Visit website
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
