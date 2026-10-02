import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Clock, Briefcase, ChevronRight, Filter, X } from 'lucide-react';

export default function JobFeedPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = { search, location, page };
      if (skillsFilter) params.skills = skillsFilter;
      if (seniorityFilter) params.seniority = seniorityFilter;
      const data = await api.getJobs(params);
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleApply = async (jobId: string) => {
    setApplying(true);
    try {
      await api.applyToJob(jobId);
      setApplied(prev => new Set(prev).add(jobId));
    } catch (err: any) {
      alert(err.message);
    }
    setApplying(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Find Your Next Opportunity</h1>
          <p className="page-subtitle">{total} jobs available</p>
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <div style={{ position: 'relative', flex: 2 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 38, width: '100%' }} placeholder="Search jobs, skills, companies…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 38, width: '100%' }} placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
        <button type="button" className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)} title="Advanced Filters">
          <Filter size={16} />
        </button>
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="card" style={{ marginTop: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>🔧 Advanced Filters</h4>
            <button className="btn btn-sm" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }} onClick={() => setShowFilters(false)}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Skills (comma-separated)</label>
              <input className="input" placeholder="React, Python, AWS" value={skillsFilter} onChange={e => setSkillsFilter(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Seniority</label>
              <select className="input" value={seniorityFilter} onChange={e => setSeniorityFilter(e.target.value)}>
                <option value="">Any</option>
                <option value="intern">Intern</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="principal">Principal</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setPage(1); fetchJobs(); }}>Apply Filters</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSkillsFilter(''); setSeniorityFilter(''); setPage(1); fetchJobs(); }}>Clear</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><div className="pulse" style={{ fontSize: '1.2rem' }}>Loading jobs…</div></div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No jobs match your search. Try different keywords.</p>
        </div>
      ) : (
        <>
          <div className="job-grid">
            {jobs.map((job: any) => (
              <div key={job.id} className="job-card" onClick={() => setSelectedJob(job)}>
                <div className="job-card-header">
                  <div className="job-title">{job.title}</div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="job-company">{job.recruiter?.name || 'Unknown Company'}</div>
                <div className="job-meta">
                  <span className="job-meta-item"><MapPin size={14} />{job.location}</span>
                  {job.salaryRange && <span className="job-meta-item">💰 {job.salaryRange}</span>}
                  <span className="job-meta-item"><Clock size={14} />{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="job-skills">
                  {(job.skillsRequired || []).slice(0, 5).map((s: string) => (
                    <span key={s} className="badge badge-primary">{s}</span>
                  ))}
                  {(job.skillsRequired?.length || 0) > 5 && <span className="badge badge-secondary">+{job.skillsRequired.length - 5}</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span style={{ color: 'var(--text-secondary)', lineHeight: '36px', fontSize: '0.85rem' }}>Page {page}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{selectedJob.recruiter?.name}</p>
            <div className="job-meta" style={{ marginBottom: 16 }}>
              <span className="job-meta-item"><MapPin size={14} />{selectedJob.location}</span>
              {selectedJob.salaryRange && <span className="job-meta-item">💰 {selectedJob.salaryRange}</span>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedJob.description}</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 8 }}>Required Skills</h3>
              <div className="job-skills">
                {(selectedJob.skillsRequired || []).map((s: string) => (
                  <span key={s} className="badge badge-primary">{s}</span>
                ))}
              </div>
            </div>
            {user ? (
              applied.has(selectedJob.id) ? (
                <button className="btn btn-secondary btn-lg" style={{ width: '100%' }} disabled>✓ Applied</button>
              ) : (
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => handleApply(selectedJob.id)} disabled={applying}>
                  {applying ? 'Applying…' : '⚡ 1-Click Apply'}
                </button>
              )
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sign in to apply</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
