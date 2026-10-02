import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BarChart3, TrendingUp, Users, Briefcase, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalyticsDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Analytics</h1></div></div>
        <div className="empty-state pulse">Loading analytics…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fade-in">
        <div className="page-header"><div><h1 className="page-title">Analytics</h1></div></div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>No data available yet. Post some jobs and wait for applicants!</p>
        </div>
      </div>
    );
  }

  const { funnel, weeklyTrend, skillDemand, jobStats } = data;

  // Funnel chart data
  const funnelStages = [
    { label: 'Applied', value: funnel.applied, color: '#6366f1' },
    { label: 'Reviewing', value: funnel.reviewing, color: '#8b5cf6' },
    { label: 'Shortlisted', value: funnel.shortlisted, color: '#06b6d4' },
    { label: 'Interview', value: funnel.interview, color: '#14b8a6' },
    { label: 'Hired', value: funnel.hired, color: '#10b981' },
    { label: 'Rejected', value: funnel.rejected, color: '#ef4444' },
  ];
  const maxFunnel = Math.max(...funnelStages.map(s => s.value), 1);

  // Weekly trend chart
  const maxWeekly = Math.max(...weeklyTrend.map((w: any) => w.count), 1);

  // Skill demand chart
  const maxSkill = Math.max(...(skillDemand.map((s: any) => s.count) || [1]), 1);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={28} style={{ display: 'inline', marginRight: 12, verticalAlign: 'middle' }} />
            Analytics
          </h1>
          <p className="page-subtitle">{funnel.total} total applications across {jobStats.length} jobs</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6366f115', color: '#6366f1' }}><Users size={22} /></div>
          <div><div className="stat-value">{funnel.total}</div><div className="stat-label">Total Applications</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98115', color: '#10b981' }}><Target size={22} /></div>
          <div><div className="stat-value">{funnel.hired}</div><div className="stat-label">Hired</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#06b6d415', color: '#06b6d4' }}><TrendingUp size={22} /></div>
          <div>
            <div className="stat-value">
              {funnel.total > 0 ? Math.round((funnel.hired / funnel.total) * 100) : 0}%
            </div>
            <div className="stat-label">Conversion Rate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}><Briefcase size={22} /></div>
          <div><div className="stat-value">{jobStats.length}</div><div className="stat-label">Job Postings</div></div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Application Funnel */}
        <div className="card analytics-card">
          <h3 style={{ marginBottom: 24 }}>Application Funnel</h3>
          <div className="funnel-chart">
            {funnelStages.map((stage, i) => (
              <div key={stage.label} className="funnel-row">
                <div className="funnel-label">{stage.label}</div>
                <div className="funnel-bar-track">
                  <div
                    className="funnel-bar"
                    style={{
                      width: `${(stage.value / maxFunnel) * 100}%`,
                      background: stage.color,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                </div>
                <div className="funnel-value">{stage.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Applications Trend */}
        <div className="card analytics-card">
          <h3 style={{ marginBottom: 24 }}>Weekly Applications</h3>
          <div className="bar-chart">
            {weeklyTrend.map((week: any, i: number) => (
              <div key={i} className="bar-column">
                <div className="bar-value">{week.count}</div>
                <div className="bar-fill-wrapper">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(week.count / maxWeekly) * 100}%`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                </div>
                <div className="bar-label">{week.week}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Demand */}
        <div className="card analytics-card">
          <h3 style={{ marginBottom: 24 }}>Top Skills in Demand</h3>
          {skillDemand.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>No skill data yet</p></div>
          ) : (
            <div className="skill-demand">
              {skillDemand.map((item: any, i: number) => (
                <div key={item.skill} className="skill-demand-row">
                  <div className="skill-demand-label">
                    <span className="skill-demand-rank">{i + 1}</span>
                    {item.skill}
                  </div>
                  <div className="skill-demand-bar-track">
                    <div
                      className="skill-demand-bar"
                      style={{
                        width: `${(item.count / maxSkill) * 100}%`,
                        animationDelay: `${i * 0.06}s`,
                      }}
                    />
                  </div>
                  <div className="skill-demand-count">{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Performance Table */}
        <div className="card analytics-card">
          <h3 style={{ marginBottom: 24 }}>Job Performance</h3>
          {jobStats.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>No jobs posted yet</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Applicants</th>
                    <th>Avg Match</th>
                  </tr>
                </thead>
                <tbody>
                  {jobStats.map((job: any) => (
                    <tr key={job.jobId}>
                      <td style={{ fontWeight: 600 }}>{job.title}</td>
                      <td><span className="badge badge-primary">{job.applicants}</span></td>
                      <td>
                        <span className={`match-score-inline ${job.avgMatch >= 60 ? 'match-high-text' : job.avgMatch >= 30 ? 'match-medium-text' : 'match-low-text'}`}>
                          {job.avgMatch}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
